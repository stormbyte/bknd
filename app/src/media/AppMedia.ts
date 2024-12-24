import type { PrimaryFieldType } from "core";
import { EntityIndex, type EntityManager } from "data";
import { type FileUploadedEventData, Storage, type StorageAdapter } from "media";
import { Module } from "modules/Module";
import { type FieldSchema, boolean, datetime, entity, json, number, text } from "../data/prototype";
import { MediaController } from "./api/MediaController";
import { ADAPTERS, buildMediaSchema, type mediaConfigSchema, registry } from "./media-schema";

export type MediaFieldSchema = FieldSchema<typeof AppMedia.mediaFields>;
declare module "core" {
   interface DB {
      media: { id: PrimaryFieldType } & MediaFieldSchema;
   }
}

export class AppMedia extends Module<typeof mediaConfigSchema> {
   private _storage?: Storage;

   override async build() {
      if (!this.config.enabled) {
         this.setBuilt();
         return;
      }

      if (!this.config.adapter) {
         console.info("No storage adapter provided, skip building media.");
         return;
      }

      // build adapter
      let adapter: StorageAdapter;
      try {
         const { type, config } = this.config.adapter;
         adapter = new (registry.get(type as any).cls)(config as any);

         this._storage = new Storage(adapter, this.config.storage, this.ctx.emgr);
         this.setBuilt();
         this.setupListeners();
         this.ctx.server.route(this.basepath, new MediaController(this).getController());

         // @todo: add check for media entity
         const mediaEntity = this.getMediaEntity();
         if (!this.ctx.em.hasEntity(mediaEntity)) {
            this.ctx.em.addEntity(mediaEntity);
         }

         const pathIndex = new EntityIndex(mediaEntity, [mediaEntity.field("path")!], true);
         if (!this.ctx.em.hasIndex(pathIndex)) {
            this.ctx.em.addIndex(pathIndex);
         }

         // @todo: check indices
      } catch (e) {
         console.error(e);
         throw new Error(
            `Could not build adapter with config ${JSON.stringify(this.config.adapter)}`
         );
      }
   }

   getSchema() {
      return buildMediaSchema();
   }

   get basepath() {
      return this.config.basepath;
   }

   get storage(): Storage {
      this.throwIfNotBuilt();
      return this._storage!;
   }

   uploadedEventDataToMediaPayload(info: FileUploadedEventData) {
      return {
         path: info.name,
         mime_type: info.meta.type,
         size: info.meta.size,
         etag: info.etag,
         modified_at: new Date()
      };
   }

   static mediaFields = {
      path: text().required(),
      folder: boolean({ default_value: false, hidden: true, fillable: ["create"] }),
      mime_type: text(),
      size: number(),
      scope: text({ hidden: true, fillable: ["create"] }),
      etag: text(),
      modified_at: datetime(),
      reference: text(),
      entity_id: number(),
      metadata: json()
   };

   getMediaEntity() {
      const entity_name = this.config.entity_name;
      if (!this.em.hasEntity(entity_name)) {
         return entity(entity_name, AppMedia.mediaFields, undefined, "system");
      }

      return this.em.entity(entity_name);
   }

   get em(): EntityManager {
      return this.ctx.em;
   }

   private setupListeners() {
      //const media = this._entity;
      const { emgr, em } = this.ctx;
      const media = this.getMediaEntity().name as "media";

      // when file is uploaded, sync with media entity
      // @todo: need a way for singleton events!
      emgr.onEvent(
         Storage.Events.FileUploadedEvent,
         async (e) => {
            const mutator = em.mutator(media);
            mutator.__unstable_toggleSystemEntityCreation(false);
            await mutator.insertOne(this.uploadedEventDataToMediaPayload(e.params));
            mutator.__unstable_toggleSystemEntityCreation(true);
            console.log("App:storage:file uploaded", e);
         },
         "sync"
      );

      // when file is deleted, sync with media entity
      emgr.onEvent(
         Storage.Events.FileDeletedEvent,
         async (e) => {
            // simple file deletion sync
            const { data } = await em.repo(media).findOne({ path: e.params.name });
            if (data) {
               console.log("item.data", data);
               await em.mutator(media).deleteOne(data.id);
            }

            console.log("App:storage:file deleted", e);
         },
         "sync"
      );
   }

   override getOverwritePaths() {
      // if using 'set' or mocked 'set' (patch), then "." is prepended
      return [/^\.?adapter$/];
   }

   // @todo: add unit tests for toJSON!
   override toJSON(secrets?: boolean) {
      if (!this.isBuilt() || !this.config.enabled) {
         return this.configDefault;
      }

      return {
         ...this.config,
         adapter: this.storage.getAdapter().toJSON(secrets)
      };
   }
}
