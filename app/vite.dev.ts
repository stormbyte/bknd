import { serveStatic } from "@hono/node-server/serve-static";
import { createClient } from "@libsql/client/node";
import { App, type BkndConfig, type CreateAppConfig } from "./src";
import { LibsqlConnection } from "./src/data";
import { StorageLocalAdapter } from "./src/media/storage/adapters/StorageLocalAdapter";
import { registries } from "./src/modules/registries";

registries.media.add("local", {
   cls: StorageLocalAdapter,
   schema: StorageLocalAdapter.prototype.getSchema()
});

const connection = new LibsqlConnection(
   createClient({
      url: "file:.db/new.db"
   })
);

function createApp(config: BkndConfig, env: any) {
   const create_config = typeof config.app === "function" ? config.app(env) : config.app;
   return App.create(create_config as CreateAppConfig);
}

export async function serveFresh(config: BkndConfig) {
   return {
      async fetch(request: Request, env: any) {
         const app = createApp(config, env);

         app.emgr.on(
            "app-built",
            async () => {
               await config.onBuilt?.(app as any);
               app.registerAdminController();
               app.module.server.client.get("/assets/*", serveStatic({ root: "./" }));
            },
            "sync"
         );
         await app.build();

         return app.fetch(request, env);
      }
   };
}

export default await serveFresh({
   app: {
      connection
   },
   setAdminHtml: true
});
