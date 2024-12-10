import path from "node:path";
import { serve as honoServe } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { App, type CreateAppConfig } from "bknd";

export type NodeAdapterOptions = CreateAppConfig & {
   relativeDistPath?: string;
   port?: number;
   hostname?: string;
   listener?: Parameters<typeof honoServe>[1];
   onBuilt?: (app: App) => Promise<void>;
   buildOptions?: Parameters<App["build"]>[0];
};

export function serve({
   relativeDistPath,
   port = 1337,
   hostname,
   listener,
   onBuilt,
   buildOptions = {},
   ...config
}: NodeAdapterOptions = {}) {
   const root = path.relative(
      process.cwd(),
      path.resolve(relativeDistPath ?? "./node_modules/bknd/dist", "static")
   );
   let app: App;

   honoServe(
      {
         port,
         hostname,
         fetch: async (req: Request) => {
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

            return app.fetch(req);
         }
      },
      (connInfo) => {
         console.log(`Server is running on http://localhost:${connInfo.port}`);
         listener?.(connInfo);
      }
   );
}
