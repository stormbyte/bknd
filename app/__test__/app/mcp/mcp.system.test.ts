import { describe, test, expect, beforeAll } from "bun:test";
import { type App, createApp, createMcpToolCaller } from "core/test/utils";
import { getSystemMcp } from "modules/mcp/system-mcp";
import { inspect } from "node:util";
inspect.defaultOptions.depth = 10;

/**
 * - [ ] system_config
 * - [ ] system_build
 * - [ ] system_ping
 * - [ ] system_info
 * - [ ] config_server_get
 * - [ ] config_server_update
 */
describe("mcp system", async () => {
   let app: App;
   let server: ReturnType<typeof getSystemMcp>;
   beforeAll(async () => {
      app = createApp({
         initialConfig: {
            server: {
               mcp: {
                  enabled: true,
               },
            },
         },
      });
      await app.build();
      server = getSystemMcp(app);
   });

   const tool = createMcpToolCaller();

   test("system_ping", async () => {
      const result = await tool(server, "system_ping", {});
      expect(result).toEqual({ pong: true });
   });
});
