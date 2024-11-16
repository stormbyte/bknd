import { Diff } from "@sinclair/typebox/value";
import { Guard } from "auth";
import { DebugLogger, isDebug } from "core";
import { EventManager } from "core/events";
import { Default, type Static, objectEach, transformObject } from "core/utils";
import { type Connection, EntityManager } from "data";
import { Hono } from "hono";
import { type Kysely, sql } from "kysely";
import { CURRENT_VERSION, TABLE_NAME, migrate, migrateSchema } from "modules/migrations";
import { AppServer } from "modules/server/AppServer";
import { AppAuth } from "../auth/AppAuth";
import { AppData } from "../data/AppData";
import { AppFlows } from "../flows/AppFlows";
import { AppMedia } from "../media/AppMedia";
import type { Module, ModuleBuildContext } from "./Module";

export const MODULES = {
   server: AppServer,
   data: AppData<any>,
   auth: AppAuth,
   media: AppMedia,
   flows: AppFlows
} as const;

// get names of MODULES as an array
export const MODULE_NAMES = Object.keys(MODULES) as ModuleKey[];

export type ModuleKey = keyof typeof MODULES;
export type Modules = {
   [K in keyof typeof MODULES]: InstanceType<(typeof MODULES)[K]>;
};

export type ModuleSchemas = {
   [K in keyof typeof MODULES]: ReturnType<(typeof MODULES)[K]["prototype"]["getSchema"]>;
};

export type ModuleConfigs = {
   [K in keyof ModuleSchemas]: Static<ModuleSchemas[K]>;
};

export type InitialModuleConfigs = {
   version: number;
} & Partial<ModuleConfigs>;

export type ModuleManagerOptions = {
   initial?: InitialModuleConfigs;
   eventManager?: EventManager<any>;
   onUpdated?: <Module extends keyof Modules>(
      module: Module,
      config: ModuleConfigs[Module]
   ) => Promise<void>;
   // base path for the hono instance
   basePath?: string;
};

type ConfigTable<Json = ModuleConfigs> = {
   version: number;
   type: "config" | "diff" | "backup";
   json: Json;
   created_at?: Date;
   updated_at?: Date;
};

export class ModuleManager {
   private modules: Modules;
   em!: EntityManager<any>;
   server!: Hono;
   emgr!: EventManager;
   guard!: Guard;

   private _version: number = 0;
   private _built = false;
   private _fetched = false;
   private readonly _provided;

   private logger = new DebugLogger(isDebug() && false);

   constructor(
      private readonly connection: Connection,
      private options?: Partial<ModuleManagerOptions>
   ) {
      this.modules = {} as Modules;
      this.emgr = new EventManager();
      const context = this.ctx(true);
      let initial = {} as Partial<ModuleConfigs>;

      if (options?.initial) {
         const { version, ...initialConfig } = options.initial;
         if (version && initialConfig) {
            this._version = version;
            initial = initialConfig;

            this._provided = true;
         } else {
            throw new Error("Initial was provided, but it needs a version!");
         }
      }

      for (const key in MODULES) {
         const moduleConfig = key in initial ? initial[key] : {};
         const module = new MODULES[key](moduleConfig, context) as Module;
         module.setListener(async (c) => {
            await this.onModuleConfigUpdated(key, c);
         });

         this.modules[key] = module;
      }
   }

   /**
    * This is set through module's setListener
    * It's called everytime a module's config is updated in SchemaObject
    * Needs to rebuild modules and save to database
    */
   private async onModuleConfigUpdated(key: string, config: any) {
      if (this.options?.onUpdated) {
         await this.options.onUpdated(key as any, config);
      } else {
         this.buildModules();
      }
   }

   private rebuildServer() {
      this.server = new Hono();
      if (this.options?.basePath) {
         this.server = this.server.basePath(this.options.basePath);
      }

      // @todo: this is a current workaround, controllers must be reworked
      objectEach(this.modules, (module) => {
         if ("getMiddleware" in module) {
            const middleware = module.getMiddleware();
            if (middleware) {
               this.server.use(middleware);
            }
         }
      });
   }

   ctx(rebuild?: boolean): ModuleBuildContext {
      if (rebuild) {
         this.rebuildServer();
         this.em = new EntityManager([], this.connection, [], [], this.emgr);
         this.guard = new Guard();
      }

      return {
         connection: this.connection,
         server: this.server,
         em: this.em,
         emgr: this.emgr,
         guard: this.guard
      };
   }

   private get db() {
      return this.connection.kysely as Kysely<{ table: ConfigTable }>;
   }

   get table() {
      return TABLE_NAME as "table";
   }

   private async fetch(): Promise<ConfigTable> {
      this.logger.context("fetch").log("fetching");

      const startTime = performance.now();
      const result = await this.db
         .selectFrom(this.table)
         .selectAll()
         .where("type", "=", "config")
         .orderBy("version", "desc")
         .executeTakeFirstOrThrow();

      this.logger.log("took", performance.now() - startTime, "ms", result).clear();
      return result;
   }

   async save() {
      this.logger.context("save").log("saving version", this.version());
      const configs = this.configs();
      const version = this.version();

      const json = JSON.stringify(configs) as any;
      const state = await this.fetch();

      if (state.version !== version) {
         // @todo: mark all others as "backup"
         this.logger.log("version conflict, storing new version", state.version, version);
         await this.db
            .insertInto(this.table)
            .values({
               version,
               type: "config",
               json
            })
            .execute();
      } else {
         this.logger.log("version matches");

         const diff = Diff(state.json, JSON.parse(json));
         this.logger.log("checking diff", diff);

         if (diff.length > 0) {
            // store diff
            await this.db
               .insertInto(this.table)
               .values({
                  version,
                  type: "diff",
                  json: JSON.stringify(diff) as any
               })
               .execute();

            await this.db
               .updateTable(this.table)
               .set({ version, json, updated_at: sql`CURRENT_TIMESTAMP` })
               .where((eb) => eb.and([eb("type", "=", "config"), eb("version", "=", version)]))
               .execute();
         } else {
            this.logger.log("no diff, not saving");
         }
      }

      // cleanup
      /*this.logger.log("cleaning up");
      const result = await this.db
         .deleteFrom(this.table)
         .where((eb) =>
            eb.or([
               // empty migrations
               eb.and([
                  eb("type", "=", "config"),
                  eb("version", "<", version),
                  eb("json", "is", null)
               ]),
               // past diffs
               eb.and([eb("type", "=", "diff"), eb("version", "<", version)])
            ])
         )
         .executeTakeFirst();
      this.logger.log("cleaned up", result.numDeletedRows);*/

      this.logger.clear();
      return this;
   }

   private async migrate() {
      this.logger.context("migrate").log("migrating?", this.version(), CURRENT_VERSION);

      if (this.version() < CURRENT_VERSION) {
         this.logger.log("there are migrations, verify version");

         // modules must be built before migration
         await this.buildModules({ graceful: true });

         try {
            const state = await this.fetch();
            if (state.version !== this.version()) {
               // @todo: potentially drop provided config and use database version
               throw new Error(
                  `Given version (${this.version()}) and fetched version (${state.version}) do not match.`
               );
            }
         } catch (e: any) {
            this.logger.clear(); // fetch couldn't clear

            // if table doesn't exist, migrate schema to version
            if (e.message.includes("no such table")) {
               this.logger.log("table has to created, migrating schema up to", this.version());
               await migrateSchema(this.version(), { db: this.db });
            } else {
               throw new Error(`Version is ${this.version()}, fetch failed: ${e.message}`);
            }
         }

         this.logger.log("now migrating");
         let version = this.version();
         let configs: any = this.configs();
         //console.log("migrating with", version, configs);
         if (Object.keys(configs).length === 0) {
            throw new Error("No config to migrate");
         }

         const [_version, _configs] = await migrate(version, configs, {
            db: this.db
         });
         version = _version;
         configs = _configs;

         this.setConfigs(configs);
         /* objectEach(configs, (config, key) => {
            this.get(key as any).setConfig(config);
         }); */

         this._version = version;
         this.logger.log("migrated to", version);

         await this.save();
      } else {
         this.logger.log("no migrations needed");
      }

      this.logger.clear();
   }

   private setConfigs(configs: ModuleConfigs): void {
      objectEach(configs, (config, key) => {
         try {
            // setting "noEmit" to true, to not force listeners to update
            this.modules[key].schema().set(config as any, true);
         } catch (e) {
            console.error(e);
            throw new Error(
               `Failed to set config for module ${key}: ${JSON.stringify(config, null, 2)}`
            );
         }
      });
   }

   private async buildModules(options?: { graceful?: boolean }) {
      this.logger.log("buildModules() triggered", options?.graceful, this._built);
      if (options?.graceful && this._built) {
         this.logger.log("skipping build (graceful)");
         return;
      }

      const ctx = this.ctx(true);
      for (const key in this.modules) {
         this.logger.log(`building "${key}"`);
         await this.modules[key].setContext(ctx).build();
      }

      this._built = true;
      this.logger.log("modules built");
   }

   async build() {
      this.logger.context("build").log("version", this.version());

      // if no config provided, try fetch from db
      if (this.version() === 0) {
         this.logger.context("build no config").log("version is 0");
         try {
            const result = await this.fetch();

            // set version and config from fetched
            this._version = result.version;
            this.setConfigs(result.json);
         } catch (e: any) {
            this.logger.clear(); // fetch couldn't clear

            this.logger.context("error handler").log("fetch failed", e.message);
            // if table doesn't exist, migrate schema, set default config and latest version
            if (e.message.includes("no such table")) {
               this.logger.log("migrate schema to", CURRENT_VERSION);
               await migrateSchema(CURRENT_VERSION, { db: this.db });
               this._version = CURRENT_VERSION;

               // we can safely build modules, since config version is up to date
               // it's up to date because we use default configs (no fetch result)
               await this.buildModules();
               await this.save();

               this.logger.clear();
               return this;
            } else {
               throw e;
               //throw new Error("Issues connecting to the database. Reason: " + e.message);
            }
         }
         this.logger.clear();
      }

      // migrate to latest if needed
      await this.migrate();

      this.logger.log("building");
      await this.buildModules();
      return this;
   }

   get<K extends keyof Modules>(key: K): Modules[K] {
      if (!(key in this.modules)) {
         throw new Error(`Module "${key}" doesn't exist, cannot get`);
      }
      return this.modules[key];
   }

   version() {
      return this._version;
   }

   built() {
      return this._built;
   }

   configs(): ModuleConfigs {
      return transformObject(this.modules, (module) => module.toJSON(true)) as any;
   }

   getSchema() {
      const schemas = transformObject(this.modules, (module) => module.getSchema());

      return {
         version: this.version(),
         ...schemas
      };
   }

   toJSON(secrets?: boolean): { version: number } & ModuleConfigs {
      const modules = transformObject(this.modules, (module) => {
         if (this._built) {
            return module.isBuilt() ? module.toJSON(secrets) : module.configDefault;
         }

         // returns no config if the all modules are not built
         return undefined;
      });

      return {
         version: this.version(),
         ...modules
      } as any;
   }
}

export function getDefaultSchema(pretty = false) {
   const schema = {
      type: "object",
      ...transformObject(MODULES, (module) => module.prototype.getSchema())
   };

   return JSON.stringify(schema, null, pretty ? 2 : undefined);
}

export function getDefaultConfig(pretty = false): ModuleConfigs {
   const config = transformObject(MODULES, (module) => {
      return Default(module.prototype.getSchema(), {});
   });

   return JSON.stringify(config, null, pretty ? 2 : undefined) as any;
}
