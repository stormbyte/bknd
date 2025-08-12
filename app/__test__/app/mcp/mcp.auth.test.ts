import { describe, beforeAll } from "bun:test";
import { type App, createApp } from "core/test/utils";
import { getSystemMcp } from "modules/mcp/system-mcp";

/**
 * - [ ] auth_me
 * - [ ] auth_strategies
 * - [ ] auth_user_create
 * - [ ] auth_user_token
 * - [ ] auth_user_password_change
 * - [ ] auth_user_password_test
 * - [ ] config_auth_update
 * - [ ] config_auth_strategies_get
 * - [ ] config_auth_strategies_add
 * - [ ] config_auth_strategies_update
 * - [ ] config_auth_strategies_remove
 * - [ ] config_auth_roles_get
 * - [ ] config_auth_roles_add
 * - [ ] config_auth_roles_update
 * - [ ] config_auth_roles_remove
 */
describe("mcp auth", async () => {
   let app: App;
   let server: ReturnType<typeof getSystemMcp>;
   beforeAll(async () => {
      app = createApp({
         initialConfig: {
            auth: {
               enabled: true,
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
