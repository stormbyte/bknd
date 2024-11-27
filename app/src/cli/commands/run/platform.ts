import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ServeStaticOptions } from "@hono/node-server/serve-static";
import { type Config, createClient } from "@libsql/client/node";
import { Connection, LibsqlConnection, SqliteLocalConnection } from "data";
import type { MiddlewareHandler } from "hono";
import { fileExists, getDistPath, getRelativeDistPath } from "../../utils/sys";

export const PLATFORMS = ["node", "bun"] as const;
export type Platform = (typeof PLATFORMS)[number];

export async function serveStatic(server: Platform): Promise<MiddlewareHandler> {
   switch (server) {
      case "node": {
         const m = await import("@hono/node-server/serve-static");
         return m.serveStatic({
            // somehow different for node
            root: getRelativeDistPath() + "/static"
         });
      }
      case "bun": {
         const m = await import("hono/bun");
         return m.serveStatic({
            root: path.resolve(getRelativeDistPath(), "static")
         });
      }
   }
}

export async function attachServeStatic(app: any, platform: Platform) {
   app.module.server.client.get("/*", await serveStatic(platform));
}

export async function startServer(server: Platform, app: any, options: { port: number }) {
   const port = options.port;
   console.log("running on", server, port);
   switch (server) {
      case "node": {
         // https://github.com/honojs/node-server/blob/main/src/response.ts#L88
         const serve = await import("@hono/node-server").then((m) => m.serve);
         serve({
            fetch: (req) => app.fetch(req),
            port
         });
         break;
      }
      case "bun": {
         Bun.serve({
            fetch: (req) => app.fetch(req),
            port
         });
         break;
      }
   }

   console.log("Server listening on", "http://localhost:" + port);
}

export async function getHtml() {
   return await readFile(path.resolve(getDistPath(), "static/index.html"), "utf-8");
}

export function getConnection(connectionOrConfig?: Connection | Config): Connection {
   if (connectionOrConfig) {
      if (connectionOrConfig instanceof Connection) {
         return connectionOrConfig;
      }

      if ("url" in connectionOrConfig) {
         return new LibsqlConnection(createClient(connectionOrConfig));
      }
   }

   console.log("Using in-memory database");
   return new LibsqlConnection(createClient({ url: ":memory:" }));
   //return new SqliteLocalConnection(new Database(":memory:"));
}

export async function getConfigPath(filePath?: string) {
   if (filePath) {
      const config_path = path.resolve(process.cwd(), filePath);
      if (await fileExists(config_path)) {
         return config_path;
      }
   }

   const paths = ["./bknd.config", "./bknd.config.ts", "./bknd.config.js"];
   for (const p of paths) {
      const _p = path.resolve(process.cwd(), p);
      if (await fileExists(_p)) {
         return _p;
      }
   }

   return;
}
