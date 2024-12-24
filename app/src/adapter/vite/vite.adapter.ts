import { serveStatic } from "@hono/node-server/serve-static";
import { type RuntimeBkndConfig, createRuntimeApp } from "adapter";
import type { CreateAppConfig } from "bknd";
import type { App } from "bknd";

export type ViteBkndConfig<Env = any> = RuntimeBkndConfig & {
   app: CreateAppConfig | ((env: Env) => CreateAppConfig);
   setAdminHtml?: boolean;
   forceDev?: boolean;
   html?: string;
};

async function createApp(config: ViteBkndConfig, env: any) {
   const create_config = typeof config.app === "function" ? config.app(env) : config.app;
   return await createRuntimeApp({
      ...create_config,
      adminOptions: config.setAdminHtml
         ? { html: config.html, forceDev: config.forceDev }
         : undefined,
      serveStatic: ["/assets/*", serveStatic({ root: config.distPath ?? "./" })]
   });
}

export async function serveFresh(config: ViteBkndConfig) {
   return {
      async fetch(request: Request, env: any, ctx: ExecutionContext) {
         const app = await createApp(config, env);
         return app.fetch(request, env, ctx);
      }
   };
}

let app: App;
export async function serveCached(config: ViteBkndConfig) {
   return {
      async fetch(request: Request, env: any, ctx: ExecutionContext) {
         if (!app) {
            app = await createApp(config, env);
         }

         return app.fetch(request, env, ctx);
      }
   };
}
