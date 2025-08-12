import { describe, test, expect, beforeAll, mock } from "bun:test";
import { type App, createApp, createMcpToolCaller } from "core/test/utils";
import { getSystemMcp } from "modules/mcp/system-mcp";

/**
 * - [x] config_server_get
 * - [x] config_server_update
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

   test("config_server_get", async () => {
      const result = await tool(server, "config_server_get", {});
      expect(result).toEqual({
         path: "",
         secrets: false,
         partial: false,
         value: app.toJSON().server,
      });
   });

   test("config_server_update", async () => {
      const original = app.toJSON().server;
      const result = await tool(server, "config_server_update", {
         value: {
            cors: {
               origin: "http://localhost",
            },
         },
         return_config: true,
      });

      expect(result).toEqual({
         success: true,
         module: "server",
         config: {
            ...original,
            cors: {
               ...original.cors,
               origin: "http://localhost",
            },
         },
      });
      expect(app.toJSON().server.cors.origin).toBe("http://localhost");
   });
});
