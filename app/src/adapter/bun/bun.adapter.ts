import { readFile } from "node:fs/promises";
import path from "node:path";
import { App, type CreateAppConfig } from "bknd";
import { serveStatic } from "hono/bun";

let app: App;
export function serve(config: CreateAppConfig, distPath?: string) {
   const root = path.resolve(distPath ?? "./node_modules/bknd/dist", "static");

   return async (req: Request) => {
      if (!app) {
         app = App.create(config);

         app.emgr.on(
            "app-built",
            async () => {
               app.modules.server.get(
                  "/assets/*",
                  serveStatic({
                     root
                  })
               );
               app.module?.server?.setAdminHtml(await readFile(root + "/index.html", "utf-8"));
            },
            "sync"
         );

         await app.build();
      }

      return app.modules.server.fetch(req);
   };
}
