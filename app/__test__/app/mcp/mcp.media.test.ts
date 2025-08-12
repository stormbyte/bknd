import { describe, it, expect, beforeAll } from "bun:test";
import { type App, createApp } from "core/test/utils";
import { getSystemMcp } from "modules/mcp/system-mcp";
import { registries } from "index";
import { StorageLocalAdapter } from "adapter/node/storage/StorageLocalAdapter";

/**
 * - [ ] config_media_get
 * - [ ] config_media_update
 * - [ ] config_media_adapter_get
 * - [ ] config_media_adapter_update
 */
describe("mcp media", async () => {
   let app: App;
   let server: ReturnType<typeof getSystemMcp>;
   beforeAll(async () => {
      registries.media.register("local", StorageLocalAdapter);
      app = createApp({
         initialConfig: {
            media: {
               enabled: true,
               adapter: {
                  type: "local",
                  config: {
                     path: "./",
                  },
               },
            },
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
});
