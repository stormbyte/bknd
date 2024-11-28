import { serveStatic } from "@hono/node-server/serve-static";
import type { BkndConfig } from "bknd";
import { App } from "bknd";

function createApp(config: BkndConfig, env: any) {
   const create_config = typeof config.app === "function" ? config.app(env) : config.app;
   return App.create(create_config);
}

function setAppBuildListener(app: App, config: BkndConfig, html?: string) {
   app.emgr.on(
      "app-built",
      async () => {
         await config.onBuilt?.(app);
         if (config.setAdminHtml) {
            app.registerAdminController({ html, forceDev: true });
            app.module.server.client.get("/assets/*", serveStatic({ root: "./" }));
         }
      },
      "sync"
   );
}

export async function serveFresh(config: BkndConfig, _html?: string) {
   return {
      async fetch(request: Request, env: any, ctx: ExecutionContext) {
         const app = createApp(config, env);

         setAppBuildListener(app, config, _html);
         await app.build();

         return app.fetch(request, env, ctx);
      }
   };
}

let app: App;
export async function serveCached(config: BkndConfig, _html?: string) {
   return {
      async fetch(request: Request, env: any, ctx: ExecutionContext) {
         if (!app) {
            app = createApp(config, env);
            setAppBuildListener(app, config, _html);
            await app.build();
         }

         return app.fetch(request, env, ctx);
      }
   };
}
