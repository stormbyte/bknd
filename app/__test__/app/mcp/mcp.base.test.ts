import { describe, it, expect } from "bun:test";
import { createApp } from "core/test/utils";
import { getSystemMcp } from "modules/mcp/system-mcp";
import { registries } from "index";
import { StorageLocalAdapter } from "adapter/node/storage/StorageLocalAdapter";

describe("mcp", () => {
   it("should have tools", async () => {
      registries.media.register("local", StorageLocalAdapter);

      const app = createApp({
         initialConfig: {
            auth: {
               enabled: true,
            },
            media: {
               enabled: true,
               adapter: {
                  type: "local",
                  config: {
                     path: "./",
                  },
               },
            },
         },
      });
      await app.build();

      const server = getSystemMcp(app);
      expect(server.tools.length).toBeGreaterThan(0);
   });
});
