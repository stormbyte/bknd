/// <reference types="bun-types" />

import path from "node:path";
import type { App } from "bknd";
import { type RuntimeBkndConfig, createRuntimeApp } from "bknd/adapter";
import { registerLocalMediaAdapter } from "bknd/adapter/node";
import { config } from "bknd/core";
import type { ServeOptions } from "bun";
import { serveStatic } from "hono/bun";

let app: App;

export type BunBkndConfig = RuntimeBkndConfig & Omit<ServeOptions, "fetch">;

export async function createApp({ distPath, ...config }: RuntimeBkndConfig = {}) {
   const root = path.resolve(distPath ?? "./node_modules/bknd/dist", "static");

   if (!app) {
      registerLocalMediaAdapter();
      app = await createRuntimeApp({
         ...config,
         serveStatic: serveStatic({ root })
      });
   }

   return app;
}

export function serve({
   distPath,
   connection,
   initialConfig,
   options,
   port = config.server.default_port,
   onBuilt,
   buildConfig,
   ...serveOptions
}: BunBkndConfig = {}) {
   Bun.serve({
      ...serveOptions,
      port,
      fetch: async (request: Request) => {
         const app = await createApp({
            connection,
            initialConfig,
            options,
            onBuilt,
            buildConfig,
            distPath
         });
         return app.fetch(request);
      }
   });

   console.log(`Server is running on http://localhost:${port}`);
}
