import { transformObject } from "core/utils";
import {
   DataPermissions,
   type Entity,
   EntityIndex,
   type EntityManager,
   constructEntity,
   constructRelation
} from "data";
import { Module } from "modules/Module";
import { DataController } from "./api/DataController";
import { type AppDataConfig, dataConfigSchema } from "./data-schema";

export class AppData<DB> extends Module<typeof dataConfigSchema> {
   override async build() {
      const entities = transformObject(this.config.entities ?? {}, (entityConfig, name) => {
         return constructEntity(name, entityConfig);
      });

      const _entity = (_e: Entity | string): Entity => {
         const name = typeof _e === "string" ? _e : _e.name;
         const entity = entities[name];
         if (entity) return entity;
         throw new Error(`Entity "${name}" not found`);
      };

      const relations = transformObject(this.config.relations ?? {}, (relation) =>
         constructRelation(relation, _entity)
      );

      const indices = transformObject(this.config.indices ?? {}, (index, name) => {
         const entity = _entity(index.entity)!;
         const fields = index.fields.map((f) => entity.field(f)!);
         return new EntityIndex(entity, fields, index.unique, name);
      });

      for (const entity of Object.values(entities)) {
         this.ctx.em.addEntity(entity);
      }

      for (const relation of Object.values(relations)) {
         this.ctx.em.addRelation(relation);
      }

      for (const index of Object.values(indices)) {
         this.ctx.em.addIndex(index);
      }

      this.ctx.server.route(
         this.basepath,
         new DataController(this.ctx, this.config).getController()
      );
      this.ctx.guard.registerPermissions(Object.values(DataPermissions));

      this.setBuilt();
   }

   getSchema() {
      return dataConfigSchema;
   }

   get em(): EntityManager<DB> {
      this.throwIfNotBuilt();
      return this.ctx.em;
   }

   private get basepath() {
      return this.config.basepath ?? "/api/data";
   }

   override getOverwritePaths() {
      return [
         /^entities\..*\.config$/,
         /^entities\..*\.fields\..*\.config$/
         ///^entities\..*\.fields\..*\.config\.schema$/
      ];
   }

   /*registerController(server: AppServer) {
      console.log("adding data controller to", this.basepath);
      server.add(this.basepath, new DataController(this.em));
   }*/

   override toJSON(secrets?: boolean): AppDataConfig {
      return {
         ...this.config,
         ...this.em.toJSON()
      };
   }
}
