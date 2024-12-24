import type { IncomingMessage } from "node:http";
import { App, type CreateAppConfig, registries } from "bknd";
import type { MiddlewareHandler } from "hono";
import { StorageLocalAdapter } from "media/storage/adapters/StorageLocalAdapter";
import type { AdminControllerOptions } from "modules/server/AdminController";

type BaseExternalBkndConfig = CreateAppConfig & {
   onBuilt?: (app: App) => Promise<void>;
   beforeBuild?: (app: App) => Promise<void>;
   buildConfig?: Parameters<App["build"]>[0];
};

export type FrameworkBkndConfig = BaseExternalBkndConfig;

export type RuntimeBkndConfig = BaseExternalBkndConfig & {
   distPath?: string;
};

export function nodeRequestToRequest(req: IncomingMessage): Request {
   let protocol = "http";
   try {
      protocol = req.headers["x-forwarded-proto"] as string;
   } catch (e) {}
   const host = req.headers.host;
   const url = `${protocol}://${host}${req.url}`;
   const headers = new Headers();

   for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) {
         headers.append(key, value.join(", "));
      } else if (value) {
         headers.append(key, value);
      }
   }

   const method = req.method || "GET";
   return new Request(url, {
      method,
      headers
   });
}

export function registerLocalMediaAdapter() {
   registries.media.register("local", StorageLocalAdapter);
}

export async function createFrameworkApp(config: FrameworkBkndConfig): Promise<App> {
   const app = App.create(config);

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

export async function createRuntimeApp({
   serveStatic,
   registerLocalMedia,
   adminOptions,
   ...config
}: RuntimeBkndConfig & {
   serveStatic?: MiddlewareHandler | [string, MiddlewareHandler];
   registerLocalMedia?: boolean;
   adminOptions?: AdminControllerOptions | false;
}): Promise<App> {
   if (registerLocalMedia) {
      registerLocalMediaAdapter();
   }

   const app = App.create(config);

   app.emgr.onEvent(
      App.Events.AppBuiltEvent,
      async () => {
         if (serveStatic) {
            if (Array.isArray(serveStatic)) {
               const [path, handler] = serveStatic;
               app.modules.server.get(path, handler);
            } else {
               app.modules.server.get("/*", serveStatic);
            }
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
