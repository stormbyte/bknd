import path from "node:path";
import { App, type CreateAppConfig } from "bknd";
import { LibsqlConnection } from "bknd/data";
import { serveStatic } from "hono/bun";

async function getConnection(conn?: CreateAppConfig["connection"]) {
   if (conn) {
      if (LibsqlConnection.isConnection(conn)) {
         return conn;
      }

      return new LibsqlConnection(conn.config);
   }

   const createClient = await import("@libsql/client/node").then((m) => m.createClient);
   if (!createClient) {
      throw new Error('libsql client not found, you need to install "@libsql/client/node"');
   }

   console.log("Using in-memory database");
   return new LibsqlConnection(createClient({ url: ":memory:" }));
}

export function serve(_config: Partial<CreateAppConfig> = {}, distPath?: string) {
   const root = path.resolve(distPath ?? "./node_modules/bknd/dist", "static");
   let app: App;

   return async (req: Request) => {
      if (!app) {
         const connection = await getConnection(_config.connection);
         app = App.create({
            ..._config,
            connection
         });

         app.emgr.on(
            "app-built",
            async () => {
               app.modules.server.get(
                  "/*",
                  serveStatic({
                     root
                  })
               );
               app.registerAdminController();
            },
            "sync"
         );

         await app.build();
      }

      return app.fetch(req);
   };
}
