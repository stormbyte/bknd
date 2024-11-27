import path from "node:path";
import { serve as honoServe } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { App, type CreateAppConfig } from "bknd";
import { LibsqlConnection } from "bknd/data";

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

export type NodeAdapterOptions = {
   relativeDistPath?: string;
   port?: number;
   hostname?: string;
   listener?: Parameters<typeof honoServe>[1];
};

export function serve(_config: Partial<CreateAppConfig> = {}, options: NodeAdapterOptions = {}) {
   const root = path.relative(
      process.cwd(),
      path.resolve(options.relativeDistPath ?? "./node_modules/bknd/dist", "static")
   );
   let app: App;

   honoServe(
      {
         port: options.port ?? 1337,
         hostname: options.hostname,
         fetch: async (req: Request) => {
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
         }
      },
      options.listener
   );
}
