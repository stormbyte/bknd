import type { CreateUserPayload } from "auth/AppAuth";
import { Event } from "core/events";
import { Connection, type LibSqlCredentials, LibsqlConnection } from "data";
import type { Hono } from "hono";
import {
   type InitialModuleConfigs,
   ModuleManager,
   type ModuleManagerOptions,
   type Modules
} from "modules/ModuleManager";
import * as SystemPermissions from "modules/permissions";
import { AdminController, type AdminControllerOptions } from "modules/server/AdminController";
import { SystemController } from "modules/server/SystemController";

export type AppPlugin = (app: App) => Promise<void> | void;

abstract class AppEvent<A = {}> extends Event<{ app: App } & A> {}
export class AppConfigUpdatedEvent extends AppEvent {
   static override slug = "app-config-updated";
}
export class AppBuiltEvent extends AppEvent {
   static override slug = "app-built";
}
export class AppFirstBoot extends AppEvent {
   static override slug = "app-first-boot";
}
export const AppEvents = { AppConfigUpdatedEvent, AppBuiltEvent, AppFirstBoot } as const;

export type CreateAppConfig = {
   connection?:
      | Connection
      | {
           type: "libsql";
           config: LibSqlCredentials;
        };
   initialConfig?: InitialModuleConfigs;
   plugins?: AppPlugin[];
   options?: Omit<ModuleManagerOptions, "initial" | "onUpdated">;
};

export type AppConfig = InitialModuleConfigs;

export class App {
   modules: ModuleManager;
   static readonly Events = AppEvents;
   adminController?: AdminController;
   private trigger_first_boot = false;

   constructor(
      private connection: Connection,
      _initialConfig?: InitialModuleConfigs,
      private plugins: AppPlugin[] = [],
      moduleManagerOptions?: ModuleManagerOptions
   ) {
      this.modules = new ModuleManager(connection, {
         ...moduleManagerOptions,
         initial: _initialConfig,
         onUpdated: async (key, config) => {
            // if the EventManager was disabled, we assume we shouldn't
            // respond to events, such as "onUpdated".
            if (!this.emgr.enabled) {
               console.warn("[APP] config updated, but event manager is disabled, skip.");
               return;
            }

            console.log("[APP] config updated", key);
            await this.build({ sync: true, save: true });
            await this.emgr.emit(new AppConfigUpdatedEvent({ app: this }));
         },
         onFirstBoot: async () => {
            console.log("[APP] first boot");
            this.trigger_first_boot = true;
         },
         onServerInit: async (server) => {
            server.use(async (c, next) => {
               c.set("app", this);
               await next();
            });
         }
      });
      this.modules.ctx().emgr.registerEvents(AppEvents);
   }

   get emgr() {
      return this.modules.ctx().emgr;
   }

   async build(options?: { sync?: boolean; drop?: boolean; save?: boolean }) {
      await this.modules.build();

      if (options?.sync) {
         const syncResult = await this.module.data.em
            .schema()
            .sync({ force: true, drop: options.drop });
         //console.log("syncing", syncResult);
      }

      const { guard, server } = this.modules.ctx();

      // load system controller
      guard.registerPermissions(Object.values(SystemPermissions));
      server.route("/api/system", new SystemController(this).getController());

      // load plugins
      if (this.plugins.length > 0) {
         await Promise.all(this.plugins.map((plugin) => plugin(this)));
      }

      await this.emgr.emit(new AppBuiltEvent({ app: this }));

      server.all("/api/*", async (c) => c.notFound());

      if (options?.save) {
         await this.modules.save();
      }

      // first boot is set from ModuleManager when there wasn't a config table
      if (this.trigger_first_boot) {
         this.trigger_first_boot = false;
         await this.emgr.emit(new AppFirstBoot({ app: this }));
      }
   }

   mutateConfig<Module extends keyof Modules>(module: Module) {
      return this.modules.get(module).schema();
   }

   get server() {
      return this.modules.server;
   }

   get em() {
      return this.modules.ctx().em;
   }

   get fetch(): Hono["fetch"] {
      return this.server.fetch;
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

   isBuilt(): boolean {
      return this.modules.isBuilt();
   }

   registerAdminController(config?: AdminControllerOptions) {
      // register admin
      this.adminController = new AdminController(this, config);
      this.modules.server.route(config?.basepath ?? "/", this.adminController.getController());
      return this;
   }

   toJSON(secrets?: boolean) {
      return this.modules.toJSON(secrets);
   }

   static create(config: CreateAppConfig) {
      return createApp(config);
   }

   async createUser(p: CreateUserPayload) {
      return this.module.auth.createUser(p);
   }
}

export function createApp(config: CreateAppConfig = {}) {
   let connection: Connection | undefined = undefined;

   try {
      if (Connection.isConnection(config.connection)) {
         connection = config.connection;
      } else if (typeof config.connection === "object") {
         connection = new LibsqlConnection(config.connection.config);
      } else {
         connection = new LibsqlConnection({ url: ":memory:" });
         console.warn("[!] No connection provided, using in-memory database");
      }
   } catch (e) {
      console.error("Could not create connection", e);
   }

   if (!connection) {
      throw new Error("Invalid connection");
   }

   return new App(connection, config.initialConfig, config.plugins, config.options);
}
