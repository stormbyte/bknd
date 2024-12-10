/// <reference types="bun-types" />

import path from "node:path";
import { App, type CreateAppConfig } from "bknd";
import type { Serve, ServeOptions } from "bun";
import { serveStatic } from "hono/bun";

let app: App;
export async function createApp(_config: Partial<CreateAppConfig> = {}, distPath?: string) {
   const root = path.resolve(distPath ?? "./node_modules/bknd/dist", "static");

   if (!app) {
      app = App.create(_config);

      app.emgr.on(
         "app-built",
         async () => {
            app.modules.server.get(
               "/*",
               serveStatic({
                  root
               })
            );
            app.registerAdminController();
         },
         "sync"
      );

      await app.build();
   }

   return app;
}

export type BunAdapterOptions = Omit<ServeOptions, "fetch"> &
   CreateAppConfig & {
      distPath?: string;
   };

export function serve({
   distPath,
   connection,
   initialConfig,
   plugins,
   options,
   port = 1337,
   ...serveOptions
}: BunAdapterOptions = {}) {
   Bun.serve({
      ...serveOptions,
      port,
      fetch: async (request: Request) => {
         const app = await createApp({ connection, initialConfig, plugins, options }, distPath);
         return app.fetch(request);
      }
   });

   console.log(`Server is running on http://localhost:${port}`);
}
