import { App, type CreateAppConfig } from "bknd";
import { config as $config } from "bknd/core";
import type { MiddlewareHandler } from "hono";
import type { AdminControllerOptions } from "modules/server/AdminController";

export type BkndConfig<Args = any> = CreateAppConfig & {
   app?: CreateAppConfig | ((args: Args) => CreateAppConfig);
   onBuilt?: (app: App) => Promise<void>;
   beforeBuild?: (app: App) => Promise<void>;
   buildConfig?: Parameters<App["build"]>[0];
};

export type FrameworkBkndConfig<Args = any> = BkndConfig<Args>;

export type RuntimeBkndConfig<Args = any> = BkndConfig<Args> & {
   distPath?: string;
};

export function makeConfig<Args = any>(config: BkndConfig<Args>, args?: Args): CreateAppConfig {
   let additionalConfig: CreateAppConfig = {};
   if ("app" in config && config.app) {
      if (typeof config.app === "function") {
         if (!args) {
            throw new Error("args is required when config.app is a function");
         }
         additionalConfig = config.app(args);
      } else {
         additionalConfig = config.app;
      }
   }

   return { ...config, ...additionalConfig };
}

export async function createFrameworkApp<Args = any>(
   config: FrameworkBkndConfig,
   args?: Args
): Promise<App> {
   const app = App.create(makeConfig(config, args));

   if (config.onBuilt) {
      app.emgr.onEvent(
         App.Events.AppBuiltEvent,
         async () => {
            await config.onBuilt?.(app);
         },
         "sync"
      );
   }

   await config.beforeBuild?.(app);
   await app.build(config.buildConfig);

   return app;
}

export async function createRuntimeApp<Env = any>(
   {
      serveStatic,
      adminOptions,
      ...config
   }: RuntimeBkndConfig & {
      serveStatic?: MiddlewareHandler | [string, MiddlewareHandler];
      adminOptions?: AdminControllerOptions | false;
   },
   env?: Env
): Promise<App> {
   const app = App.create(makeConfig(config, env));

   app.emgr.onEvent(
      App.Events.AppBuiltEvent,
      async () => {
         if (serveStatic) {
            const [path, handler] = Array.isArray(serveStatic)
               ? serveStatic
               : [$config.server.assets_path + "*", serveStatic];
            app.modules.server.get(path, handler);
         }

         await config.onBuilt?.(app);
         if (adminOptions !== false) {
            app.registerAdminController(adminOptions);
         }
      },
      "sync"
   );

   await config.beforeBuild?.(app);
   await app.build(config.buildConfig);

   return app;
}
