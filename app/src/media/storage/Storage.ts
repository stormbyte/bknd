import { type EmitsEvents, EventManager } from "core/events";
import type { TSchema } from "core/utils";
import { type Context, Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import * as StorageEvents from "./events";
import type { FileUploadedEventData } from "./events";

export type FileListObject = {
   key: string;
   last_modified: Date;
   size: number;
};

export type FileMeta = { type: string; size: number };
export type FileBody = ReadableStream | ArrayBuffer | ArrayBufferView | string | null | Blob | File;
export type FileUploadPayload = {
   name: string;
   meta: FileMeta;
   etag: string;
};

export interface StorageAdapter {
   /**
    * The unique name of the storage adapter
    */
   getName(): string;

   // @todo: method requires limit/offset parameters
   listObjects(prefix?: string): Promise<FileListObject[]>;
   putObject(key: string, body: FileBody): Promise<string | FileUploadPayload | undefined>;
   deleteObject(key: string): Promise<void>;
   objectExists(key: string): Promise<boolean>;
   getObject(key: string, headers: Headers): Promise<Response>;
   getObjectUrl(key: string): string;
   getObjectMeta(key: string): Promise<FileMeta>;
   getSchema(): TSchema | undefined;
   toJSON(secrets?: boolean): any;
}

export type StorageConfig = {
   body_max_size: number;
};

export class Storage implements EmitsEvents {
   readonly #adapter: StorageAdapter;
   static readonly Events = StorageEvents;
   readonly emgr: EventManager<typeof Storage.Events>;
   readonly config: StorageConfig;

   constructor(
      adapter: StorageAdapter,
      config: Partial<StorageConfig> = {},
      emgr?: EventManager<any>
   ) {
      this.#adapter = adapter;
      this.config = {
         ...config,
         body_max_size: config.body_max_size ?? 20 * 1024 * 1024
      };

      this.emgr = emgr ?? new EventManager();
      this.emgr.registerEvents(Storage.Events);
   }

   getAdapter(): StorageAdapter {
      return this.#adapter;
   }

   async objectMetadata(key: string): Promise<FileMeta> {
      return await this.#adapter.getObjectMeta(key);
   }

   //randomizeFilename(filename: string): string {}

   getConfig(): StorageConfig {
      return this.config;
   }

   async uploadFile(
      file: FileBody,
      name: string,
      noEmit?: boolean
   ): Promise<FileUploadedEventData> {
      const result = await this.#adapter.putObject(name, file);
      console.log("result", result);

      let info: FileUploadPayload;

      switch (typeof result) {
         case "undefined":
            throw new Error("Failed to upload file");
         case "string": {
            // get object meta
            const meta = await this.#adapter.getObjectMeta(name);
            if (!meta) {
               throw new Error("Failed to get object meta");
            }

            info = { name, meta, etag: result };
            break;
         }
         case "object":
            info = result;
            break;
      }

      const eventData = {
         file,
         ...info,
         state: {
            name: info.name,
            path: info.name
         }
      };
      if (!noEmit) {
         await this.emgr.emit(new StorageEvents.FileUploadedEvent(eventData));
      }

      return eventData;
   }

   async deleteFile(name: string): Promise<void> {
      await this.#adapter.deleteObject(name);
      await this.emgr.emit(new StorageEvents.FileDeletedEvent({ name }));
   }

   async fileExists(name: string) {
      return await this.#adapter.objectExists(name);
   }

   getController(): any {
      // @todo: multiple providers?
      // @todo: implement range requests

      const hono = new Hono();

      // get files list (temporary)
      hono.get("/files", async (c) => {
         const files = await this.#adapter.listObjects();
         return c.json(files);
      });

      // get file by name
      hono.get("/file/:filename", async (c) => {
         const { filename } = c.req.param();
         if (!filename) {
            throw new Error("No file name provided");
         }
         //console.log("getting file", filename, headersToObject(c.req.raw.headers));

         await this.emgr.emit(new StorageEvents.FileAccessEvent({ name: filename }));
         return await this.#adapter.getObject(filename, c.req.raw.headers);
      });

      // delete a file by name
      hono.delete("/file/:filename", async (c) => {
         const { filename } = c.req.param();
         if (!filename) {
            throw new Error("No file name provided");
         }
         await this.deleteFile(filename);

         return c.json({ message: "File deleted" });
      });

      // upload file
      hono.post(
         "/upload/:filename",
         bodyLimit({
            maxSize: this.config.body_max_size,
            onError: (c: any) => {
               return c.text(`Payload exceeds ${this.config.body_max_size}`, 413);
            }
         }),
         async (c) => {
            const { filename } = c.req.param();
            if (!filename) {
               throw new Error("No file name provided");
            }

            const file = await this.getFileFromRequest(c);
            return c.json(await this.uploadFile(file, filename));
         }
      );

      return hono;
   }

   /**
    * If uploaded through HttpPie -> ReadableStream
    * If uploaded in tests -> file == ReadableStream
    * If uploaded in FE -> content_type:body multipart/form-data; boundary=----WebKitFormBoundary7euoBFF12B0AHWLn
    * file File {
    *   size: 223052,
    *   type: 'image/png',
    *   name: 'noise_white.png',
    *   lastModified: 1731743671176
    * }
    * @param c
    */
   async getFileFromRequest(c: Context): Promise<FileBody> {
      const content_type = c.req.header("Content-Type") ?? "application/octet-stream";
      console.log("content_type:body", content_type);
      const body = c.req.raw.body;
      if (!body) {
         throw new Error("No body");
      }

      let file: FileBody | undefined;
      if (content_type?.startsWith("multipart/form-data")) {
         file = (await c.req.formData()).get("file") as File;
         // @todo: check nextjs, it's not *that* [File] type (but it's uploadable)
         if (typeof file === "undefined") {
            throw new Error("No file given at form data 'file'");
         }
         /*console.log("file", file);
         if (!(file instanceof File)) {
            throw new Error("No file given at form data 'file'");
         }*/
      } else if (content_type?.startsWith("application/octet-stream")) {
         file = body;
      } else {
         throw new Error(`Unsupported content type: ${content_type}`);
      }

      return file;
   }
}
