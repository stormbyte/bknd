import { describe, test, expect, beforeAll } from "bun:test";
import { type App, createApp, createMcpToolCaller } from "core/test/utils";
import { getSystemMcp } from "modules/mcp/system-mcp";

/**
 * - [ ] data_sync
 * - [ ] data_entity_fn_count
 * - [ ] data_entity_fn_exists
 * - [ ] data_entity_read_one
 * - [ ] data_entity_read_many
 * - [ ] data_entity_insert
 * - [ ] data_entity_update_many
 * - [ ] data_entity_update_one
 * - [ ] data_entity_delete_one
 * - [ ] data_entity_delete_many
 * - [ ] data_entity_info
 * - [ ] config_data_get
 * - [ ] config_data_update
 * - [x] config_data_entities_get
 * - [x] config_data_entities_add
 * - [x] config_data_entities_update
 * - [x] config_data_entities_remove
 * - [ ] config_data_relations_get
 * - [ ] config_data_relations_add
 * - [ ] config_data_relations_update
 * - [ ] config_data_relations_remove
 * - [ ] config_data_indices_get
 * - [ ] config_data_indices_add
 * - [ ] config_data_indices_update
 * - [ ] config_data_indices_remove
 */
describe("mcp data", async () => {
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
      server.setLogLevel("error");
      server.onNotification((message) => {
         console.dir(message, { depth: null });
      });
   });

   const tool = createMcpToolCaller();

   test("config_data_entities_{add,get,update,remove}", async () => {
      const result = await tool(server, "config_data_entities_add", {
         key: "test",
         value: {},
      });
      expect(result.success).toBe(true);
      expect(result.module).toBe("data");
      expect(result.config.entities.test.type).toEqual("regular");

      const entities = Object.keys(app.toJSON().data.entities ?? {});
      expect(entities).toContain("test");

      {
         // get
         const result = await tool(server, "config_data_entities_get", {
            key: "test",
         });
         expect(result.module).toBe("data");
         expect(result.key).toBe("test");
         expect(result.value.type).toEqual("regular");
      }

      {
         // update
         const result = await tool(server, "config_data_entities_update", {
            key: "test",
            value: {
               config: {
                  name: "Test",
               },
            },
         });
         expect(result.success).toBe(true);
         expect(result.module).toBe("data");
         expect(result.config.entities.test.config?.name).toEqual("Test");
         expect(app.toJSON().data.entities?.test?.config?.name).toEqual("Test");
      }

      {
         // remove
         const result = await tool(server, "config_data_entities_remove", {
            key: "test",
         });
         expect(result.success).toBe(true);
         expect(result.module).toBe("data");
         expect(app.toJSON().data.entities?.test).toBeUndefined();
      }
   });
});
