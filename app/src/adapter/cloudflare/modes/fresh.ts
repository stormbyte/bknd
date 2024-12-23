import type { BkndConfig } from "adapter";
import { App } from "bknd";
import type { Context } from "../index";

export async function makeApp(config: BkndConfig, { env, html }: Context) {
   const create_config = typeof config.app === "function" ? config.app(env) : config.app;
   const app = App.create(create_config);

   if (config.onBuilt) {
      app.emgr.onEvent(
         App.Events.AppBuiltEvent,
         async ({ params: { app } }) => {
            config.onBuilt!(app);
         },
         "sync"
      );
   }
   await app.build();

   if (config.setAdminHtml) {
      app.registerAdminController({ html });
   }

   return app;
}

export async function getFresh(config: BkndConfig, ctx: Context) {
   const app = await makeApp(config, ctx);
   return app.fetch(ctx.request);
}

let warm_app: App;
export async function getWarm(config: BkndConfig, ctx: Context) {
   if (!warm_app) {
      warm_app = await makeApp(config, ctx);
   }

   return warm_app.fetch(ctx.request);
}
