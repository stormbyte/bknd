import type { TObject, TString } from "@sinclair/typebox";
import { type Constructor, Registry } from "core";

export { MIME_TYPES } from "./storage/mime-types";
export {
   Storage,
   type StorageAdapter,
   type FileMeta,
   type FileListObject,
   type StorageConfig
} from "./storage/Storage";
import type { StorageAdapter } from "./storage/Storage";
import {
   type CloudinaryConfig,
   StorageCloudinaryAdapter
} from "./storage/adapters/StorageCloudinaryAdapter";
import { type S3AdapterConfig, StorageS3Adapter } from "./storage/adapters/StorageS3Adapter";

export { StorageS3Adapter, type S3AdapterConfig, StorageCloudinaryAdapter, type CloudinaryConfig };
/*export {
   StorageLocalAdapter,
   type LocalAdapterConfig
} from "./storage/adapters/StorageLocalAdapter";*/

export * as StorageEvents from "./storage/events";
export { type FileUploadedEventData } from "./storage/events";
export * from "./utils";

type ClassThatImplements<T> = Constructor<T> & { prototype: T };

export const MediaAdapterRegistry = new Registry<{
   cls: ClassThatImplements<StorageAdapter>;
   schema: TObject;
}>().set({
   s3: {
      cls: StorageS3Adapter,
      schema: StorageS3Adapter.prototype.getSchema()
   },
   cloudinary: {
      cls: StorageCloudinaryAdapter,
      schema: StorageCloudinaryAdapter.prototype.getSchema()
   }
});

export const Adapters = {
   s3: {
      cls: StorageS3Adapter,
      schema: StorageS3Adapter.prototype.getSchema()
   },
   cloudinary: {
      cls: StorageCloudinaryAdapter,
      schema: StorageCloudinaryAdapter.prototype.getSchema()
   }
} as const;
