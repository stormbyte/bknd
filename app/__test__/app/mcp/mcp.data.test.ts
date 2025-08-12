import { describe, it, expect, beforeAll } from "bun:test";
import { type App, createApp } from "core/test/utils";
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
 * - [ ] config_data_entities_get
 * - [ ] config_data_entities_add
 * - [ ] config_data_entities_update
 * - [ ] config_data_entities_remove
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
   });
});
