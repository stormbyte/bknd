import { Event } from "core/events";
import { Connection, type LibSqlCredentials, LibsqlConnection } from "data";
import {
   type InitialModuleConfigs,
   ModuleManager,
   type ModuleManagerOptions,
   type Modules
} from "modules/ModuleManager";
import * as SystemPermissions from "modules/permissions";
import { SystemController } from "modules/server/SystemController";

export type AppPlugin<DB> = (app: App<DB>) => void;

export class AppConfigUpdatedEvent extends Event<{ app: App }> {
   static override slug = "app-config-updated";
}
export class AppBuiltEvent extends Event<{ app: App }> {
   static override slug = "app-built";
}
export const AppEvents = { AppConfigUpdatedEvent, AppBuiltEvent } as const;

export type CreateAppConfig = {
   connection:
      | Connection
      | {
           type: "libsql";
           config: LibSqlCredentials;
        };
   initialConfig?: InitialModuleConfigs;
   plugins?: AppPlugin<any>[];
   options?: ModuleManagerOptions;
};

export type AppConfig = InitialModuleConfigs;

export class App<DB = any> {
   modules: ModuleManager;
   static readonly Events = AppEvents;

   constructor(
      private connection: Connection,
      _initialConfig?: InitialModuleConfigs,
      private plugins: AppPlugin<DB>[] = [],
      moduleManagerOptions?: ModuleManagerOptions
   ) {
      this.modules = new ModuleManager(connection, {
         ...moduleManagerOptions,
         initial: _initialConfig,
         onUpdated: async (key, config) => {
            //console.log("[APP] config updated", key, config);
            await this.build({ sync: true, save: true });
            await this.emgr.emit(new AppConfigUpdatedEvent({ app: this }));
         }
      });
      this.modules.ctx().emgr.registerEvents(AppEvents);
   }

   static create(config: CreateAppConfig) {
      let connection: Connection | undefined = undefined;

      if (config.connection instanceof Connection) {
         connection = config.connection;
      } else if (typeof config.connection === "object") {
         switch (config.connection.type) {
            case "libsql":
               connection = new LibsqlConnection(config.connection.config);
               break;
         }
      }
      if (!connection) {
         throw new Error("Invalid connection");
      }

      return new App(connection, config.initialConfig, config.plugins, config.options);
   }

   get emgr() {
      return this.modules.ctx().emgr;
   }

   async build(options?: { sync?: boolean; drop?: boolean; save?: boolean }) {
      //console.log("building");
      await this.modules.build();

      if (options?.sync) {
         const syncResult = await this.module.data.em
            .schema()
            .sync({ force: true, drop: options.drop });
         //console.log("syncing", syncResult);
      }

      // load system controller
      this.modules.ctx().guard.registerPermissions(Object.values(SystemPermissions));
      this.modules.server.route("/api/system", new SystemController(this).getController());

      // load plugins
      if (this.plugins.length > 0) {
         this.plugins.forEach((plugin) => plugin(this));
      }

      //console.log("emitting built", options);
      await this.emgr.emit(new AppBuiltEvent({ app: this }));

      // not found on any not registered api route
      this.modules.server.all("/api/*", async (c) => c.notFound());

      if (options?.save) {
         await this.modules.save();
      }
   }

   mutateConfig<Module extends keyof Modules>(module: Module) {
      return this.modules.get(module).schema();
   }

   get fetch(): any {
      return this.modules.server.fetch;
   }

   get module() {
      return new Proxy(
         {},
         {
            get: (_, module: keyof Modules) => {
               return this.modules.get(module);
            }
         }
      ) as Modules;
   }

   getSchema() {
      return this.modules.getSchema();
   }

   version() {
      return this.modules.version();
   }

   toJSON(secrets?: boolean) {
      return this.modules.toJSON(secrets);
   }
}
