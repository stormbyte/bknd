import path from "node:path";
import { serve as honoServe } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { registerLocalMediaAdapter } from "adapter/node/index";
import type { App } from "bknd";
import { type RuntimeBkndConfig, createRuntimeApp } from "bknd/adapter";
import { config as $config } from "bknd/core";

export type NodeBkndConfig = RuntimeBkndConfig & {
   port?: number;
   hostname?: string;
   listener?: Parameters<typeof honoServe>[1];
   /** @deprecated */
   relativeDistPath?: string;
};

export function serve({
   distPath,
   relativeDistPath,
   port = $config.server.default_port,
   hostname,
   listener,
   ...config
}: NodeBkndConfig = {}) {
   const root = path.relative(
      process.cwd(),
      path.resolve(distPath ?? relativeDistPath ?? "./node_modules/bknd/dist", "static"),
   );
   if (relativeDistPath) {
      console.warn("relativeDistPath is deprecated, please use distPath instead");
   }

   let app: App;

   honoServe(
      {
         port,
         hostname,
         fetch: async (req: Request) => {
            if (!app) {
               registerLocalMediaAdapter();
               app = await createRuntimeApp({
                  ...config,
                  serveStatic: serveStatic({ root }),
               });
            }

            return app.fetch(req);
         },
      },
      (connInfo) => {
         console.log(`Server is running on http://localhost:${connInfo.port}`);
         listener?.(connInfo);
      },
   );
}
