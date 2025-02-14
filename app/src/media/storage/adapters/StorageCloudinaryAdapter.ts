import { pickHeaders } from "core/utils";
import { type Static, Type, parse } from "core/utils";
import type { FileBody, FileListObject, FileMeta, StorageAdapter } from "../Storage";

export const cloudinaryAdapterConfig = Type.Object(
   {
      cloud_name: Type.String(),
      api_key: Type.String(),
      api_secret: Type.String(),
      upload_preset: Type.Optional(Type.String())
   },
   { title: "Cloudinary", description: "Cloudinary media storage" }
);

export type CloudinaryConfig = Static<typeof cloudinaryAdapterConfig>;

type CloudinaryObject = {
   asset_id: string;
   public_id: string;
   version: number;
   version_id: string;
   signature: string;
   width?: number;
   height?: number;
   format: string;
   resource_type: string;
   created_at: string; // date format
   tags: string[];
   bytes: number;
   type: string; // "upload" ?
   etag: string;
   placeholder: boolean;
   url: string;
   secure_url: string;
   folder: string;
   existing: boolean;
   original_filename: string;
};

type CloudinaryPutObjectResponse = CloudinaryObject;
type CloudinaryListObjectsResponse = {
   total_count: number;
   time: number;
   next_cursor: string;
   resources: (CloudinaryObject & {
      uploaded_at: string; // date format
      backup_bytes: number;
      aspect_ratio?: number;
      pixels?: number;
      status: string;
      access_mode: string;
   })[];
};

// @todo: add signed uploads
export class StorageCloudinaryAdapter implements StorageAdapter {
   private config: CloudinaryConfig;

   constructor(config: CloudinaryConfig) {
      this.config = parse(cloudinaryAdapterConfig, config);
   }

   getSchema() {
      return cloudinaryAdapterConfig;
   }

   private getMimeType(object: CloudinaryObject): string {
      switch (true) {
         case object.format === "jpeg" || object.format === "jpg":
            return "image/jpeg";
      }

      return `${object.resource_type}/${object.format}`;
   }

   getName(): string {
      return "cloudinary";
   }

   private getAuthorizationHeader() {
      const credentials = btoa(`${this.config.api_key}:${this.config.api_secret}`);
      return {
         Authorization: `Basic ${credentials}`
      };
   }

   async putObject(_key: string, body: FileBody) {
      // remove extension, as it is added by cloudinary
      const key = _key.replace(/\.[a-z0-9]{2,5}$/, "");

      const formData = new FormData();
      formData.append("file", body as any);
      formData.append("public_id", key);
      formData.append("api_key", this.config.api_key);

      if (this.config.upload_preset) {
         formData.append("upload_preset", this.config.upload_preset);
      }

      const result = await fetch(
         `https://api.cloudinary.com/v1_1/${this.config.cloud_name}/auto/upload`,
         {
            method: "POST",
            headers: {
               Accept: "application/json"
               // content type must be undefined to use correct boundaries
               //"Content-Type": "multipart/form-data",
            },
            body: formData
         }
      );

      if (!result.ok) {
         return undefined;
      }

      const data = (await result.json()) as CloudinaryPutObjectResponse;

      return {
         name: data.public_id + "." + data.format,
         etag: data.etag,
         meta: {
            type: this.getMimeType(data),
            size: data.bytes
         }
      };
   }

   async listObjects(prefix?: string): Promise<FileListObject[]> {
      const result = await fetch(
         `https://api.cloudinary.com/v1_1/${this.config.cloud_name}/resources/search`,
         {
            method: "GET",
            headers: {
               Accept: "application/json",
               ...this.getAuthorizationHeader()
            }
         }
      );

      if (!result.ok) {
         throw new Error("Failed to list objects");
      }

      const data = (await result.json()) as CloudinaryListObjectsResponse;
      return data.resources.map((item) => ({
         key: item.public_id,
         last_modified: new Date(item.uploaded_at),
         size: item.bytes
      }));
   }

   private async headObject(key: string) {
      const url = this.getObjectUrl(key);
      return await fetch(url, {
         method: "GET",
         headers: {
            Range: "bytes=0-1"
         }
      });
   }

   async objectExists(key: string): Promise<boolean> {
      const result = await this.headObject(key);
      return result.ok;
   }

   async getObjectMeta(key: string): Promise<FileMeta> {
      const result = await this.headObject(key);
      if (result.ok) {
         const type = result.headers.get("content-type");
         const size = Number(result.headers.get("content-range")?.split("/")[1]);
         return {
            type: type as string,
            size: size
         };
      }

      throw new Error("Cannot get object meta");
   }

   private guessType(key: string): string | undefined {
      const extensions = {
         image: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
         video: ["mp4", "webm", "ogg"]
      };

      const ext = key.split(".").pop();
      return Object.keys(extensions).find((type) => extensions[type].includes(ext));
   }

   getObjectUrl(key: string): string {
      const type = this.guessType(key) ?? "image";

      const objectUrl = `https://res.cloudinary.com/${this.config.cloud_name}/${type}/upload/${key}`;
      return objectUrl;
   }

   async getObject(key: string, headers: Headers): Promise<Response> {
      const res = await fetch(this.getObjectUrl(key), {
         method: "GET",
         headers: pickHeaders(headers, ["range"])
      });

      return new Response(res.body, {
         status: res.status,
         statusText: res.statusText,
         headers: res.headers
      });
   }

   async deleteObject(key: string): Promise<void> {
      const type = this.guessType(key) ?? "image";
      const formData = new FormData();
      formData.append("public_ids[]", key);

      await fetch(`https://res.cloudinary.com/${this.config.cloud_name}/${type}/upload/`, {
         method: "DELETE",
         body: formData
      });
   }

   toJSON(secrets?: boolean) {
      return {
         type: "cloudinary",
         config: secrets ? this.config : { cloud_name: this.config.cloud_name }
      };
   }
}
