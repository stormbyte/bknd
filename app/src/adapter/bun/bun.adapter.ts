/// <reference types="bun-types" />

import path from "node:path";
import { App, type CreateAppConfig } from "bknd";
import type { Serve, ServeOptions } from "bun";
import { serveStatic } from "hono/bun";

let app: App;
export type ExtendedAppCreateConfig = Partial<CreateAppConfig> & {
   distPath?: string;
   onBuilt?: (app: App) => Promise<void>;
   buildOptions?: Parameters<App["build"]>[0];
};

export async function createApp({
   distPath,
   onBuilt,
   buildOptions,
   ...config
}: ExtendedAppCreateConfig) {
   const root = path.resolve(distPath ?? "./node_modules/bknd/dist", "static");

   if (!app) {
      app = App.create(config);

      app.emgr.onEvent(
         App.Events.AppBuiltEvent,
         async () => {
            app.modules.server.get(
               "/*",
               serveStatic({
                  root
               })
            );
            app.registerAdminController();
            await onBuilt?.(app);
         },
         "sync"
      );

      await app.build(buildOptions);
   }

   return app;
}

export type BunAdapterOptions = Omit<ServeOptions, "fetch"> & ExtendedAppCreateConfig;

export function serve({
   distPath,
   connection,
   initialConfig,
   plugins,
   options,
   port = 1337,
   onBuilt,
   buildOptions,
   ...serveOptions
}: BunAdapterOptions = {}) {
   Bun.serve({
      ...serveOptions,
      port,
      fetch: async (request: Request) => {
         const app = await createApp({
            connection,
            initialConfig,
            plugins,
            options,
            onBuilt,
            buildOptions,
            distPath
         });
         return app.fetch(request);
      }
   });

   console.log(`Server is running on http://localhost:${port}`);
}
