import { readFile, readdir, stat, unlink, writeFile } from "node:fs/promises";
import { type Static, Type, parse } from "core/utils";
import type { FileBody, FileListObject, FileMeta, StorageAdapter } from "../../Storage";
import { guess } from "../../mime-types-tiny";

export const localAdapterConfig = Type.Object(
   {
      path: Type.String({ default: "./" })
   },
   { title: "Local" }
);
export type LocalAdapterConfig = Static<typeof localAdapterConfig>;

export class StorageLocalAdapter implements StorageAdapter {
   private config: LocalAdapterConfig;

   constructor(config: any) {
      this.config = parse(localAdapterConfig, config);
   }

   getSchema() {
      return localAdapterConfig;
   }

   getName(): string {
      return "local";
   }

   async listObjects(prefix?: string): Promise<FileListObject[]> {
      const files = await readdir(this.config.path);
      const fileStats = await Promise.all(
         files
            .filter((file) => !prefix || file.startsWith(prefix))
            .map(async (file) => {
               const stats = await stat(`${this.config.path}/${file}`);
               return {
                  key: file,
                  last_modified: stats.mtime,
                  size: stats.size
               };
            })
      );
      return fileStats;
   }

   private async computeEtag(content: BufferSource): Promise<string> {
      const hashBuffer = await crypto.subtle.digest("SHA-256", content);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");

      // Wrap the hex string in quotes for ETag format
      return `"${hashHex}"`;
   }

   async putObject(key: string, body: FileBody): Promise<string> {
      if (body === null) {
         throw new Error("Body is empty");
      }

      // @todo: this is too hacky
      const file = body as File;

      const filePath = `${this.config.path}/${key}`;
      await writeFile(filePath, file.stream());
      return await this.computeEtag(await file.arrayBuffer());
   }

   async deleteObject(key: string): Promise<void> {
      try {
         await unlink(`${this.config.path}/${key}`);
      } catch (e) {}
   }

   async objectExists(key: string): Promise<boolean> {
      try {
         const stats = await stat(`${this.config.path}/${key}`);
         return stats.isFile();
      } catch (error) {
         return false;
      }
   }

   async getObject(key: string, headers: Headers): Promise<Response> {
      try {
         const content = await readFile(`${this.config.path}/${key}`);
         const mimeType = guess(key);

         return new Response(content, {
            status: 200,
            headers: {
               "Content-Type": mimeType || "application/octet-stream",
               "Content-Length": content.length.toString()
            }
         });
      } catch (error) {
         // Handle file reading errors
         return new Response("", { status: 404 });
      }
   }

   getObjectUrl(key: string): string {
      throw new Error("Method not implemented.");
   }

   async getObjectMeta(key: string): Promise<FileMeta> {
      const stats = await stat(`${this.config.path}/${key}`);
      return {
         type: guess(key) || "application/octet-stream",
         size: stats.size
      };
   }

   toJSON(secrets?: boolean) {
      return {
         type: this.getName(),
         config: this.config
      };
   }
}
