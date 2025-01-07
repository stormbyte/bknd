import type { App } from "App";
import type { Guard } from "auth";
import { SchemaObject } from "core";
import type { EventManager } from "core/events";
import type { Static, TSchema } from "core/utils";
import type { Connection, EntityManager } from "data";
import type { Hono } from "hono";

export type ServerEnv = {
   Variables: {
      app: App;
      auth_resolved: boolean;
      html?: string;
   };
};

export type ModuleBuildContext = {
   connection: Connection;
   server: Hono<ServerEnv>;
   em: EntityManager;
   emgr: EventManager<any>;
   guard: Guard;
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

   getMiddleware() {
      return undefined;
   }

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
}
