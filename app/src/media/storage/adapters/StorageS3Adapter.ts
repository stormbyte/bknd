import type {
   DeleteObjectRequest,
   GetObjectRequest,
   HeadObjectRequest,
   ListObjectsV2Output,
   ListObjectsV2Request,
   PutObjectRequest
} from "@aws-sdk/client-s3";
import { AwsClient, isDebug } from "core";
import { type Static, Type, parse, pickHeaders } from "core/utils";
import { transform } from "lodash-es";
import type { FileBody, FileListObject, StorageAdapter } from "../Storage";

export const s3AdapterConfig = Type.Object(
   {
      access_key: Type.String(),
      secret_access_key: Type.String(),
      url: Type.String({
         pattern: "^https?://(?:.*)?[^/.]+$",
         description: "URL to S3 compatible endpoint without trailing slash",
         examples: [
            "https://{account_id}.r2.cloudflarestorage.com/{bucket}",
            "https://{bucket}.s3.{region}.amazonaws.com"
         ]
      })
   },
   {
      title: "S3"
   }
);

export type S3AdapterConfig = Static<typeof s3AdapterConfig>;

export class StorageS3Adapter extends AwsClient implements StorageAdapter {
   readonly #config: S3AdapterConfig;

   constructor(config: S3AdapterConfig) {
      super(
         {
            accessKeyId: config.access_key,
            secretAccessKey: config.secret_access_key,
            retries: isDebug() ? 0 : 10
         },
         {
            convertParams: "pascalToKebab",
            responseType: "xml"
         }
      );
      this.#config = parse(s3AdapterConfig, config);
   }

   getName(): string {
      return "s3";
   }

   getSchema() {
      return s3AdapterConfig;
   }

   override getUrl(path: string = "", searchParamsObj: Record<string, any> = {}): string {
      let url = this.getObjectUrl("").slice(0, -1);
      if (path.length > 0) url += `/${path}`;
      return super.getUrl(url, searchParamsObj);
   }

   /**
    * Returns the URL of an object
    * @param key the key of the object
    */
   getObjectUrl(key: string): string {
      return `${this.#config.url}/${key}`;
   }

   /**
    * https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListObjectsV2.html
    */
   async listObjects(key: string = ""): Promise<FileListObject[]> {
      const params: Omit<ListObjectsV2Request, "Bucket"> & { ListType: number } = {
         ListType: 2,
         Prefix: key
      };

      const url = this.getUrl("", params);
      //console.log("url", url);
      const res = await this.fetchJson<{ ListBucketResult: ListObjectsV2Output }>(url, {
         method: "GET"
      });
      //console.log("res", res);

      // absolutely weird, but if only one object is there, it's an object, not an array
      const { Contents } = res.ListBucketResult;
      const objects = !Contents ? [] : Array.isArray(Contents) ? Contents : [Contents];

      //console.log(JSON.stringify(res.ListBucketResult, null, 2), objects);
      const transformed = transform(
         objects,
         (acc, obj) => {
            // s3 contains folders, but Size is 0, which is filtered here
            if (obj.Key && obj.LastModified && obj.Size) {
               acc.push({
                  key: obj.Key,
                  last_modified: obj.LastModified,
                  size: obj.Size
               });
            }
         },
         [] as FileListObject[]
      );
      //console.log(transformed);

      return transformed;
   }

   async putObject(
      key: string,
      body: FileBody | null,
      // @todo: params must be added as headers, skipping for now
      params: Omit<PutObjectRequest, "Bucket" | "Key"> = {}
   ) {
      const url = this.getUrl(key, {});
      //console.log("url", url);
      const res = await this.fetch(url, {
         method: "PUT",
         body
      });
      /*console.log("putObject:raw:res", {
         ok: res.ok,
         status: res.status,
         statusText: res.statusText,
      });*/

      if (res.ok) {
         // "df20fcb574dba1446cf5ec997940492b"
         return String(res.headers.get("etag"));
      }

      return undefined;
   }

   private async headObject(
      key: string,
      params: Pick<HeadObjectRequest, "PartNumber" | "VersionId"> = {}
   ) {
      const url = this.getUrl(key, {});
      return await this.fetch(url, {
         method: "HEAD",
         headers: {
            Range: "bytes=0-1"
         }
      });
   }

   async getObjectMeta(key: string) {
      const res = await this.headObject(key);
      const type = String(res.headers.get("content-type"));
      const size = Number(String(res.headers.get("content-range")?.split("/")[1]));

      return {
         type,
         size
      };
   }

   /**
    * Check if an object exists by fetching the first byte of the object
    * @param key
    * @param params
    */
   async objectExists(
      key: string,
      params: Pick<HeadObjectRequest, "PartNumber" | "VersionId"> = {}
   ) {
      return (await this.headObject(key)).ok;
   }

   /**
    * Simply returns the Response of the object to download body as needed
    */
   async getObject(key: string, headers: Headers): Promise<Response> {
      const url = this.getUrl(key);
      const res = await this.fetch(url, {
         method: "GET",
         headers: pickHeaders(headers, ["range"])
      });

      // Response has to be copied, because of middlewares that might set headers
      return new Response(res.body, {
         status: res.status,
         statusText: res.statusText,
         headers: res.headers
      });
   }

   /**
    * Deletes a single object. Method is void, because it doesn't return anything
    */
   async deleteObject(
      key: string,
      params: Omit<DeleteObjectRequest, "Bucket" | "Key"> = {}
   ): Promise<void> {
      const url = this.getUrl(key, params);
      const res = await this.fetch(url, {
         method: "DELETE"
      });
   }

   toJSON(secrets?: boolean) {
      return {
         type: this.getName(),
         config: secrets ? this.#config : undefined
      };
   }
}
