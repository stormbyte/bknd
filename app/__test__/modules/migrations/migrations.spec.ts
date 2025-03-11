import { describe, expect, test } from "bun:test";
import { type InitialModuleConfigs, createApp } from "../../../src";

import type { Kysely } from "kysely";
import { getDummyConnection } from "../../helper";
import v7 from "./samples/v7.json";

// app expects migratable config to be present in database
async function createVersionedApp(config: InitialModuleConfigs) {
   const { dummyConnection } = getDummyConnection();

   if (!("version" in config)) throw new Error("config must have a version");
   const { version, ...rest } = config;

   const app = createApp({ connection: dummyConnection });
   await app.build();

   const qb = app.modules.ctx().connection.kysely as Kysely<any>;
   const current = await qb
      .selectFrom("__bknd")
      .selectAll()
      .where("type", "=", "config")
      .executeTakeFirst();

   await qb
      .updateTable("__bknd")
      .set("json", JSON.stringify(rest))
      .set("version", 7)
      .where("id", "=", current!.id)
      .execute();

   const app2 = createApp({
      connection: dummyConnection,
   });
   await app2.build();
   return app2;
}

describe("Migrations", () => {
   /**
    * updated auth strategies to have "enabled" prop
    * by default, migration should make all available strategies enabled
    */
   test("migration from 7 to 8", async () => {
      expect(v7.version).toBe(7);

      const app = await createVersionedApp(v7);

      expect(app.version()).toBe(8);
      expect(app.toJSON(true).auth.strategies.password.enabled).toBe(true);

      const req = await app.server.request("/api/auth/password/register", {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
         },
         body: JSON.stringify({
            email: "test@test.com",
            password: "12345678",
         }),
      });
      expect(req.ok).toBe(true);
      const res = await req.json();
      expect(res.user.email).toBe("test@test.com");
   });
});
