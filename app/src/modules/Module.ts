import type { App } from "App";
import type { Guard } from "auth";
import { SchemaObject } from "core";
import type { EventManager } from "core/events";
import type { Static, TSchema } from "core/utils";
import {
   type Connection,
   type EntityIndex,
   type EntityManager,
   type Field,
   FieldPrototype,
   make,
   type em as prototypeEm
} from "data";
import { Entity } from "data";
import type { Hono } from "hono";
import { isEqual } from "lodash-es";

export type ServerEnv = {
   Variables: {
      app?: App;
      // to prevent resolving auth multiple times
      auth_resolved?: boolean;
      // to only register once
      auth_registered?: boolean;
      // whether or not to bypass auth
      auth_skip?: boolean;
      html?: string;
   };
};

export type ModuleBuildContext = {
   connection: Connection;
   server: Hono<ServerEnv>;
   em: EntityManager;
   emgr: EventManager<any>;
   guard: Guard;
   flags: (typeof Module)["ctx_flags"];
};

export abstract class Module<Schema extends TSchema = TSchema, ConfigSchema = Static<Schema>> {
   private _built = false;
   private _schema: SchemaObject<ReturnType<(typeof this)["getSchema"]>>;
   private _listener: any = () => null;

   constructor(
      initial?: Partial<Static<Schema>>,
      protected _ctx?: ModuleBuildContext
   ) {
      this._schema = new SchemaObject(this.getSchema(), initial, {
         forceParse: this.useForceParse(),
         onUpdate: async (c) => {
            await this._listener(c);
         },
         restrictPaths: this.getRestrictedPaths(),
         overwritePaths: this.getOverwritePaths(),
         onBeforeUpdate: this.onBeforeUpdate.bind(this)
      });
   }

   static ctx_flags = {
      sync_required: false,
      ctx_reload_required: false
   } as {
      // signal that a sync is required at the end of build
      sync_required: boolean;
      ctx_reload_required: boolean;
   };

   onBeforeUpdate(from: ConfigSchema, to: ConfigSchema): ConfigSchema | Promise<ConfigSchema> {
      return to;
   }

   setListener(listener: (c: ReturnType<(typeof this)["getSchema"]>) => void | Promise<void>) {
      this._listener = listener;
      return this;
   }

   // @todo: test all getSchema() for additional properties
   abstract getSchema();

   useForceParse() {
      return false;
   }

   getRestrictedPaths(): string[] | undefined {
      return undefined;
   }

   /**
    * These paths will be overwritten, even when "patch" is called.
    * This is helpful if there are keys that contains records, which always be sent in full.
    */
   getOverwritePaths(): (RegExp | string)[] | undefined {
      return undefined;
   }

   get configDefault(): Static<ReturnType<(typeof this)["getSchema"]>> {
      return this._schema.default();
   }

   get config(): Static<ReturnType<(typeof this)["getSchema"]>> {
      return this._schema.get();
   }

   setContext(ctx: ModuleBuildContext) {
      this._ctx = ctx;
      return this;
   }

   schema() {
      return this._schema;
   }

   // action performed when server has been initialized
   // can be used to assign global middlewares
   onServerInit(hono: Hono<ServerEnv>) {}

   get ctx() {
      if (!this._ctx) {
         throw new Error("Context not set");
      }
      return this._ctx;
   }

   async build() {
      throw new Error("Not implemented");
   }

   setBuilt() {
      this._built = true;
      this._schema = new SchemaObject(this.getSchema(), this.toJSON(true), {
         onUpdate: async (c) => {
            await this._listener(c);
         },
         forceParse: this.useForceParse(),
         restrictPaths: this.getRestrictedPaths(),
         overwritePaths: this.getOverwritePaths(),
         onBeforeUpdate: this.onBeforeUpdate.bind(this)
      });
   }

   isBuilt() {
      return this._built;
   }

   throwIfNotBuilt() {
      if (!this._built) {
         throw new Error("Config not built: " + this.constructor.name);
      }
   }

   toJSON(secrets?: boolean): Static<ReturnType<(typeof this)["getSchema"]>> {
      return this.config;
   }

   protected ensureEntity(entity: Entity) {
      const instance = this.ctx.em.entity(entity.name, true);

      // check fields
      if (!instance) {
         this.ctx.em.addEntity(entity);
         this.ctx.flags.sync_required = true;
         return;
      }

      // if exists, check all fields required are there
      // @todo: check if the field also equal
      for (const field of entity.fields) {
         const instanceField = instance.field(field.name);
         if (!instanceField) {
            instance.addField(field);
            this.ctx.flags.sync_required = true;
         } else {
            const changes = this.setEntityFieldConfigs(field, instanceField);
            if (changes > 0) {
               this.ctx.flags.sync_required = true;
            }
         }
      }

      // replace entity (mainly to keep the ensured type)
      this.ctx.em.__replaceEntity(
         new Entity(instance.name, instance.fields, instance.config, entity.type)
      );
   }

   protected ensureIndex(index: EntityIndex) {
      if (!this.ctx.em.hasIndex(index)) {
         this.ctx.em.addIndex(index);
         this.ctx.flags.sync_required = true;
      }
   }

   protected ensureSchema<Schema extends ReturnType<typeof prototypeEm>>(schema: Schema): Schema {
      Object.values(schema.entities ?? {}).forEach(this.ensureEntity.bind(this));
      schema.indices?.forEach(this.ensureIndex.bind(this));

      return schema;
   }

   protected setEntityFieldConfigs(
      parent: Field,
      child: Field,
      props: string[] = ["hidden", "fillable", "required"]
   ) {
      let changes = 0;
      for (const prop of props) {
         if (!isEqual(child.config[prop], parent.config[prop])) {
            child.config[prop] = parent.config[prop];
            changes++;
         }
      }
      return changes;
   }

   protected replaceEntityField(
      _entity: string | Entity,
      field: Field | string,
      _newField: Field | FieldPrototype
   ) {
      const entity = this.ctx.em.entity(_entity);
      const name = typeof field === "string" ? field : field.name;
      const newField =
         _newField instanceof FieldPrototype ? make(name, _newField as any) : _newField;

      // ensure keeping vital config
      this.setEntityFieldConfigs(entity.field(name)!, newField);

      entity.__replaceField(name, newField);
   }
}
