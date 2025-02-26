import { type EmitsEvents, EventManager } from "core/events";
import { type TSchema, isFile } from "core/utils";
import { isMimeType } from "media/storage/mime-types-tiny";
import * as StorageEvents from "./events";
import type { FileUploadedEventData } from "./events";

export type FileListObject = {
   key: string;
   last_modified: Date;
   size: number;
};

export type FileMeta = { type: string; size: number };
export type FileBody = ReadableStream | File;
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
   body_max_size?: number;
};

export class Storage implements EmitsEvents {
   readonly #adapter: StorageAdapter;
   static readonly Events = StorageEvents;
   readonly emgr: EventManager<typeof Storage.Events>;
   readonly config: StorageConfig;

   constructor(
      adapter: StorageAdapter,
      config: Partial<StorageConfig> = {},
      emgr?: EventManager<any>,
   ) {
      this.#adapter = adapter;
      this.config = {
         ...config,
         body_max_size: config.body_max_size,
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
      noEmit?: boolean,
   ): Promise<FileUploadedEventData> {
      const result = await this.#adapter.putObject(name, file);
      if (typeof result === "undefined") {
         throw new Error("Failed to upload file");
      }

      let info: FileUploadPayload = {
         name,
         meta: {
            size: 0,
            type: "application/octet-stream",
         },
         etag: typeof result === "string" ? result : "",
      };

      if (typeof result === "object") {
         info = result;
      } else if (isFile(file)) {
         info.meta.size = file.size;
         info.meta.type = file.type;
      }

      // try to get better meta info
      if (!isMimeType(info?.meta.type, ["application/octet-stream", "application/json"])) {
         const meta = await this.#adapter.getObjectMeta(name);
         if (!meta) {
            throw new Error("Failed to get object meta");
         }
         info.meta = meta;
      }

      const eventData = {
         file,
         ...info,
         state: {
            name: info.name,
            path: info.name,
         },
      };
      if (!noEmit) {
         const result = await this.emgr.emit(new StorageEvents.FileUploadedEvent(eventData));
         if (result.returned) {
            return result.params;
         }
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
}
