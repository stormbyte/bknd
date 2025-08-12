import { createApp as createAppInternal, type CreateAppConfig } from "App";
import { bunSqlite } from "adapter/bun/connection/BunSqliteConnection";
import { Connection } from "data/connection/Connection";
import type { getSystemMcp } from "modules/mcp/system-mcp";

export { App } from "App";

export function createApp({ connection, ...config }: CreateAppConfig = {}) {
   return createAppInternal({
      ...config,
      connection: Connection.isConnection(connection) ? connection : bunSqlite(connection as any),
   });
}

export function createMcpToolCaller() {
   return async (server: ReturnType<typeof getSystemMcp>, name: string, args: any, raw?: any) => {
      const res = await server.handle(
         {
            jsonrpc: "2.0",
            method: "tools/call",
            params: {
               name,
               arguments: args,
            },
         },
         raw,
      );

      if ((res.result as any)?.isError) {
         console.dir(res.result, { depth: null });
         throw new Error((res.result as any)?.content?.[0]?.text ?? "Unknown error");
      }

      return JSON.parse((res.result as any)?.content?.[0]?.text ?? "null");
   };
}
