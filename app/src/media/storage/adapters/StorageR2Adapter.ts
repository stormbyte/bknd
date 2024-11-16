import { isDebug } from "core";
import type { FileBody, StorageAdapter } from "../Storage";
import { guessMimeType } from "../mime-types";

/**
 * Adapter for R2 storage
 * @todo: add tests (bun tests won't work, need node native tests)
 */
export class StorageR2Adapter implements StorageAdapter {
   constructor(private readonly bucket: R2Bucket) {}

   getName(): string {
      return "r2";
   }

   getSchema() {
      return undefined;
   }

   async putObject(key: string, body: FileBody) {
      try {
         const res = await this.bucket.put(key, body);
         return res?.etag;
      } catch (e) {
         return undefined;
      }
   }
   async listObjects(
      prefix?: string
   ): Promise<{ key: string; last_modified: Date; size: number }[]> {
      const list = await this.bucket.list({ limit: 50 });
      return list.objects.map((item) => ({
         key: item.key,
         size: item.size,
         last_modified: item.uploaded
      }));
   }

   private async headObject(key: string): Promise<R2Object | null> {
      return await this.bucket.head(key);
   }

   async objectExists(key: string): Promise<boolean> {
      return (await this.headObject(key)) !== null;
   }

   async getObject(key: string, headers: Headers): Promise<Response> {
      let object: R2ObjectBody | null;
      const responseHeaders = new Headers({
         "Accept-Ranges": "bytes"
      });

      //console.log("getObject:headers", headersToObject(headers));
      if (headers.has("range")) {
         const options = isDebug()
            ? {} // miniflare doesn't support range requests
            : {
                 range: headers,
                 onlyIf: headers
              };
         object = (await this.bucket.get(key, options)) as R2ObjectBody;

         if (!object) {
            return new Response(null, { status: 404 });
         }

         if (object.range) {
            const offset = "offset" in object.range ? object.range.offset : 0;
            const end = "end" in object.range ? object.range.end : object.size - 1;
            responseHeaders.set("Content-Range", `bytes ${offset}-${end}/${object.size}`);
            responseHeaders.set("Connection", "keep-alive");
            responseHeaders.set("Vary", "Accept-Encoding");
         }
      } else {
         object = (await this.bucket.get(key)) as R2ObjectBody;

         if (object === null) {
            return new Response(null, { status: 404 });
         }
      }

      //console.log("response headers:before", headersToObject(responseHeaders));
      this.writeHttpMetadata(responseHeaders, object);
      responseHeaders.set("etag", object.httpEtag);
      responseHeaders.set("Content-Length", String(object.size));
      responseHeaders.set("Last-Modified", object.uploaded.toUTCString());
      //console.log("response headers:after", headersToObject(responseHeaders));

      return new Response(object.body, {
         status: object.range ? 206 : 200,
         headers: responseHeaders
      });
   }

   private writeHttpMetadata(headers: Headers, object: R2Object | R2ObjectBody): void {
      let metadata = object.httpMetadata;
      if (!metadata || Object.keys(metadata).length === 0) {
         // guessing is especially required for dev environment (miniflare)
         metadata = {
            contentType: guessMimeType(object.key)
         };
      }
      //console.log("writeHttpMetadata", object.httpMetadata, metadata);

      for (const [key, value] of Object.entries(metadata)) {
         const camelToDash = key.replace(/([A-Z])/g, "-$1").toLowerCase();
         headers.set(camelToDash, value);
      }
   }

   async getObjectMeta(key: string): Promise<{ type: string; size: number }> {
      const head = await this.headObject(key);
      if (!head) {
         throw new Error("Object not found");
      }

      return {
         type: String(head.httpMetadata?.contentType ?? "application/octet-stream"),
         size: head.size
      };
   }

   async deleteObject(key: string): Promise<void> {
      await this.bucket.delete(key);
   }

   getObjectUrl(key: string): string {
      throw new Error("Method getObjectUrl not implemented.");
   }

   toJSON(secrets?: boolean) {
      return {
         type: this.getName(),
         config: {}
      };
   }
}
