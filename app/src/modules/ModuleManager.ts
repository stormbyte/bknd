import type { App } from "App";
import { Guard } from "auth";
import { BkndError, DebugLogger } from "core";
import { EventManager } from "core/events";
import { clone, diff } from "core/object/diff";
import {
   Default,
   type Static,
   StringEnum,
   Type,
   mark,
   objectEach,
   stripMark,
   transformObject,
   withDisabledConsole
} from "core/utils";
import {
   type Connection,
   EntityManager,
   type Schema,
   datetime,
   entity,
   enumm,
   jsonSchema,
   number
} from "data";
import { TransformPersistFailedException } from "data/errors";
import { Hono } from "hono";
import type { Kysely } from "kysely";
import { mergeWith } from "lodash-es";
import { CURRENT_VERSION, TABLE_NAME, migrate } from "modules/migrations";
import { AppServer } from "modules/server/AppServer";
import { AppAuth } from "../auth/AppAuth";
import { AppData } from "../data/AppData";
import { AppFlows } from "../flows/AppFlows";
import { AppMedia } from "../media/AppMedia";
import type { Module, ModuleBuildContext, ServerEnv } from "./Module";

export type { ModuleBuildContext };

export const MODULES = {
   server: AppServer,
   data: AppData,
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
type PartialRec<T> = { [P in keyof T]?: PartialRec<T[P]> };

export type InitialModuleConfigs =
   | ({
        version: number;
     } & ModuleConfigs)
   | PartialRec<ModuleConfigs>;

export type ModuleManagerOptions = {
   initial?: InitialModuleConfigs;
   eventManager?: EventManager<any>;
   onUpdated?: <Module extends keyof Modules>(
      module: Module,
      config: ModuleConfigs[Module]
   ) => Promise<void>;
   // triggered when no config table existed
   onFirstBoot?: () => Promise<void>;
   // base path for the hono instance
   basePath?: string;
   // callback after server was created
   onServerInit?: (server: Hono<ServerEnv>) => void;
   // doesn't perform validity checks for given/fetched config
   trustFetched?: boolean;
   // runs when initial config provided on a fresh database
   seed?: (ctx: ModuleBuildContext) => Promise<void>;
};

type ConfigTable<Json = ModuleConfigs> = {
   version: number;
   type: "config" | "diff" | "backup";
   json: Json;
   created_at?: Date;
   updated_at?: Date;
};

const configJsonSchema = Type.Union([
   getDefaultSchema(),
   Type.Array(
      Type.Object({
         t: StringEnum(["a", "r", "e"]),
         p: Type.Array(Type.Union([Type.String(), Type.Number()])),
         o: Type.Optional(Type.Any()),
         n: Type.Optional(Type.Any())
      })
   )
]);
const __bknd = entity(TABLE_NAME, {
   version: number().required(),
   type: enumm({ enum: ["config", "diff", "backup"] }).required(),
   json: jsonSchema({ schema: configJsonSchema }).required(),
   created_at: datetime(),
   updated_at: datetime()
});
type ConfigTable2 = Schema<typeof __bknd>;
interface T_INTERNAL_EM {
   __bknd: ConfigTable2;
}

// @todo: cleanup old diffs on upgrade
// @todo: cleanup multiple backups on upgrade
export class ModuleManager {
   private modules: Modules;
   // internal em for __bknd config table
   __em!: EntityManager<T_INTERNAL_EM>;
   // ctx for modules
   em!: EntityManager;
   server!: Hono<ServerEnv>;
   emgr!: EventManager;
   guard!: Guard;

   private _version: number = 0;
   private _built = false;
   private readonly _booted_with?: "provided" | "partial";

   private logger = new DebugLogger(false);

   constructor(
      private readonly connection: Connection,
      private options?: Partial<ModuleManagerOptions>
   ) {
      this.__em = new EntityManager([__bknd], this.connection);
      this.modules = {} as Modules;
      this.emgr = new EventManager();
      const context = this.ctx(true);
      let initial = {} as Partial<ModuleConfigs>;

      if (options?.initial) {
         if ("version" in options.initial) {
            const { version, ...initialConfig } = options.initial;
            this._version = version;
            initial = stripMark(initialConfig);

            this._booted_with = "provided";
         } else {
            initial = mergeWith(getDefaultConfig(), options.initial);
            this._booted_with = "partial";
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

   private repo() {
      return this.__em.repo(__bknd);
   }

   private mutator() {
      return this.__em.mutator(__bknd);
   }

   private get db() {
      return this.connection.kysely as Kysely<{ table: ConfigTable }>;
   }

   async syncConfigTable() {
      this.logger.context("sync").log("start");
      const result = await this.__em.schema().sync({ force: true });
      this.logger.log("done").clear();
      return result;
   }

   private rebuildServer() {
      this.server = new Hono<ServerEnv>();
      if (this.options?.basePath) {
         this.server = this.server.basePath(this.options.basePath);
      }
      if (this.options?.onServerInit) {
         this.options.onServerInit(this.server);
      }

      // optional method for each module to register global middlewares, etc.
      objectEach(this.modules, (module) => {
         module.onServerInit(this.server);
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

   private async fetch(): Promise<ConfigTable> {
      this.logger.context("fetch").log("fetching");

      // disabling console log, because the table might not exist yet
      return await withDisabledConsole(async () => {
         const startTime = performance.now();
         const { data: result } = await this.repo().findOne(
            { type: "config" },
            {
               sort: { by: "version", dir: "desc" }
            }
         );

         if (!result) {
            throw BkndError.with("no config");
         }

         this.logger.log("took", performance.now() - startTime, "ms", result.version).clear();
         return result as ConfigTable;
      }, ["log", "error", "warn"]);
   }

   async save() {
      this.logger.context("save").log("saving version", this.version());
      const configs = this.configs();
      const version = this.version();

      try {
         const state = await this.fetch();
         this.logger.log("fetched version", state.version);

         if (state.version !== version) {
            // @todo: mark all others as "backup"
            this.logger.log("version conflict, storing new version", state.version, version);
            await this.mutator().insertOne({
               version: state.version,
               type: "backup",
               json: configs
            });
            await this.mutator().insertOne({
               version: version,
               type: "config",
               json: configs
            });
         } else {
            this.logger.log("version matches");

            // clean configs because of Diff() function
            const diffs = diff(state.json, clone(configs));
            this.logger.log("checking diff", diffs);

            if (diff.length > 0) {
               // store diff
               await this.mutator().insertOne({
                  version,
                  type: "diff",
                  json: clone(diffs)
               });

               // store new version
               await this.mutator().updateWhere(
                  {
                     version,
                     json: configs,
                     updated_at: new Date()
                  } as any,
                  {
                     type: "config",
                     version
                  }
               );
            } else {
               this.logger.log("no diff, not saving");
            }
         }
      } catch (e) {
         if (e instanceof BkndError) {
            this.logger.log("no config, just save fresh");
            // no config, just save
            await this.mutator().insertOne({
               type: "config",
               version,
               json: configs,
               created_at: new Date(),
               updated_at: new Date()
            });
         } else if (e instanceof TransformPersistFailedException) {
            console.error("Cannot save invalid config");
            throw e;
         } else {
            console.error("Aborting");
            throw e;
         }
      }

      // @todo: cleanup old versions?

      this.logger.clear();
      return this;
   }

   private async migrate() {
      this.logger.context("migrate").log("migrating?", this.version(), CURRENT_VERSION);

      if (this.version() < CURRENT_VERSION) {
         this.logger.log("there are migrations, verify version");
         // sync __bknd table
         await this.syncConfigTable();

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
            throw new Error(`Version is ${this.version()}, fetch failed: ${e.message}`);
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

      this.logger.log("building");
      const ctx = this.ctx(true);
      for (const key in this.modules) {
         await this.modules[key].setContext(ctx).build();
         this.logger.log("built", key);
      }

      this._built = true;
      this.logger.log("modules built");
   }

   async build() {
      this.logger.context("build").log("version", this.version());
      this.logger.log("booted with", this._booted_with);

      // if no config provided, try fetch from db
      if (this.version() === 0) {
         this.logger.context("no version").log("version is 0");
         try {
            const result = await this.fetch();

            // set version and config from fetched
            this._version = result.version;

            if (this.version() !== CURRENT_VERSION) {
               await this.syncConfigTable();
            }

            if (this.options?.trustFetched === true) {
               this.logger.log("trusting fetched config (mark)");
               mark(result.json);
            }

            this.setConfigs(result.json);
         } catch (e: any) {
            this.logger.clear(); // fetch couldn't clear

            this.logger.context("error handler").log("fetch failed", e.message);

            // we can safely build modules, since config version is up to date
            // it's up to date because we use default configs (no fetch result)
            this._version = CURRENT_VERSION;
            await this.syncConfigTable();
            await this.buildModules();
            await this.save();

            // run initial setup
            await this.setupInitial();

            this.logger.clear();
            return this;
         }
         this.logger.clear();
      }

      // migrate to latest if needed
      await this.migrate();

      this.logger.log("building");
      await this.buildModules();
      return this;
   }

   protected async setupInitial() {
      const ctx = {
         ...this.ctx(),
         // disable events for initial setup
         em: this.ctx().em.fork()
      };

      // perform a sync
      await ctx.em.schema().sync({ force: true });
      await this.options?.seed?.(ctx);

      // run first boot event
      await this.options?.onFirstBoot?.();
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

export function getDefaultSchema() {
   const schema = {
      type: "object",
      ...transformObject(MODULES, (module) => module.prototype.getSchema())
   };

   return schema as any;
}

export function getDefaultConfig(): ModuleConfigs {
   const config = transformObject(MODULES, (module) => {
      return Default(module.prototype.getSchema(), {});
   });

   return config as any;
}
