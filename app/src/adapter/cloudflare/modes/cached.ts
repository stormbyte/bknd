import type { BkndConfig } from "adapter";
import { App } from "bknd";
import type { Context } from "../index";

export async function getCached(config: BkndConfig, { env, html, ctx }: Context) {
   const { kv } = config.cloudflare?.bindings?.(env)!;
   if (!kv) throw new Error("kv namespace is not defined in cloudflare.bindings");
   const key = config.cloudflare?.key ?? "app";

   const create_config = typeof config.app === "function" ? config.app(env) : config.app;
   const cachedConfig = await kv.get(key);
   const initialConfig = cachedConfig ? JSON.parse(cachedConfig) : undefined;

   const app = App.create({ ...create_config, initialConfig });

   async function saveConfig(__config: any) {
      ctx.waitUntil(kv!.put(key, JSON.stringify(__config)));
   }

   if (config.onBuilt) {
      app.emgr.onEvent(
         App.Events.AppBuiltEvent,
         async ({ params: { app } }) => {
            app.module.server.client.get("/__bknd/cache", async (c) => {
               await kv.delete(key);
               return c.json({ message: "Cache cleared" });
            });
            app.registerAdminController({ html });

            config.onBuilt!(app);
         },
         "sync"
      );
   }

   app.emgr.onEvent(
      App.Events.AppConfigUpdatedEvent,
      async ({ params: { app } }) => {
         saveConfig(app.toJSON(true));
      },
      "sync"
   );

   await app.build();

   if (config.setAdminHtml) {
      app.registerAdminController({ html });
   }

   if (!cachedConfig) {
      saveConfig(app.toJSON(true));
   }

   return app;
}
