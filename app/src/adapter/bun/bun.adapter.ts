/// <reference types="bun-types" />

import path from "node:path";
import type { App } from "bknd";
import type { ServeOptions } from "bun";
import { config } from "core";
import { serveStatic } from "hono/bun";
import { type RuntimeBkndConfig, createRuntimeApp } from "../index";

let app: App;

export type BunBkndConfig = RuntimeBkndConfig & Omit<ServeOptions, "fetch">;

export async function createApp({ distPath, ...config }: RuntimeBkndConfig = {}) {
   const root = path.resolve(distPath ?? "./node_modules/bknd/dist", "static");

   if (!app) {
      app = await createRuntimeApp({
         ...config,
         registerLocalMedia: true,
         serveStatic: serveStatic({ root })
      });
   }

   return app;
}

export function serve({
   distPath,
   connection,
   initialConfig,
   plugins,
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
            plugins,
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
