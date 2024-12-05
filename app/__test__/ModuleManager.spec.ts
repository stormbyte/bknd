import { describe, expect, test } from "bun:test";
import { mark, stripMark } from "../src/core/utils";
import { ModuleManager } from "../src/modules/ModuleManager";
import { CURRENT_VERSION, TABLE_NAME } from "../src/modules/migrations";
import { getDummyConnection } from "./helper";

describe("ModuleManager", async () => {
   test("s1: no config, no build", async () => {
      const { dummyConnection } = getDummyConnection();

      const mm = new ModuleManager(dummyConnection);

      // that is because no module is built
      expect(mm.toJSON()).toEqual({ version: 0 } as any);
   });

   test("s2: no config, build", async () => {
      const { dummyConnection } = getDummyConnection();

      const mm = new ModuleManager(dummyConnection);
      await mm.build();

      expect(mm.version()).toBe(CURRENT_VERSION);
      expect(mm.built()).toBe(true);
   });

   test("s3: config given, table exists, version matches", async () => {
      const c = getDummyConnection();
      const mm = new ModuleManager(c.dummyConnection);
      await mm.build();
      const version = mm.version();
      const json = mm.configs();
      //const { version, ...json } = mm.toJSON() as any;

      const c2 = getDummyConnection();
      const db = c2.dummyConnection.kysely;
      const mm2 = new ModuleManager(c2.dummyConnection, { initial: { version, ...json } });
      await mm2.syncConfigTable();
      await db
         .updateTable(TABLE_NAME)
         .set({ json: JSON.stringify(json), version: CURRENT_VERSION })
         .execute();

      await mm2.build();

      expect(json).toEqual(mm2.configs());
   });

   test("s4: config given, table exists, version outdated, migrate", async () => {
      const c = getDummyConnection();
      const mm = new ModuleManager(c.dummyConnection);
      await mm.build();
      const version = mm.version();
      const json = mm.configs();

      const c2 = getDummyConnection();
      const db = c2.dummyConnection.kysely;
      const mm2 = new ModuleManager(c2.dummyConnection, {
         initial: { version: version - 1, ...json }
      });
      await mm2.syncConfigTable();

      await db
         .insertInto(TABLE_NAME)
         .values({ json: JSON.stringify(json), type: "config", version: CURRENT_VERSION - 1 })
         .execute();

      await mm2.build();
   });

   test("s5: config given, table exists, version mismatch", async () => {
      const c = getDummyConnection();
      const mm = new ModuleManager(c.dummyConnection);
      await mm.build();
      const version = mm.version();
      const json = mm.configs();
      //const { version, ...json } = mm.toJSON() as any;

      const c2 = getDummyConnection();
      const db = c2.dummyConnection.kysely;

      const mm2 = new ModuleManager(c2.dummyConnection, {
         initial: { version: version - 1, ...json }
      });
      await mm2.syncConfigTable();
      await db
         .insertInto(TABLE_NAME)
         .values({ type: "config", json: JSON.stringify(json), version: CURRENT_VERSION })
         .execute();

      expect(mm2.build()).rejects.toThrow(/version.*do not match/);
   });

   test("s6: no config given, table exists, fetch", async () => {
      const c = getDummyConnection();
      const mm = new ModuleManager(c.dummyConnection);
      await mm.build();
      const json = mm.configs();
      //const { version, ...json } = mm.toJSON() as any;

      const c2 = getDummyConnection();
      const db = c2.dummyConnection.kysely;

      const mm2 = new ModuleManager(c2.dummyConnection);
      await mm2.syncConfigTable();

      const config = {
         ...json,
         data: {
            ...json.data,
            basepath: "/api/data2"
         }
      };
      await db
         .insertInto(TABLE_NAME)
         .values({ type: "config", json: JSON.stringify(config), version: CURRENT_VERSION })
         .execute();

      // run without config given
      await mm2.build();

      expect(mm2.configs().data.basepath).toBe("/api/data2");
   });

   test("blank app, modify config", async () => {
      const { dummyConnection } = getDummyConnection();

      const mm = new ModuleManager(dummyConnection);
      await mm.build();
      const configs = stripMark(mm.configs());

      expect(mm.configs().server.admin.color_scheme).toBe("light");
      expect(() => mm.get("server").schema().patch("admin", { color_scheme: "violet" })).toThrow();
      await mm.get("server").schema().patch("admin", { color_scheme: "dark" });
      await mm.save();

      expect(mm.configs().server.admin.color_scheme).toBe("dark");
      expect(stripMark(mm.configs())).toEqual({
         ...configs,
         server: {
            ...configs.server,
            admin: {
               ...configs.server.admin,
               color_scheme: "dark"
            }
         }
      });
   });

   test("partial config given", async () => {
      const { dummyConnection } = getDummyConnection();

      const partial = {
         auth: {
            enabled: true
         }
      };
      const mm = new ModuleManager(dummyConnection, {
         initial: partial
      });
      await mm.build();

      expect(mm.version()).toBe(CURRENT_VERSION);
      expect(mm.built()).toBe(true);
      expect(mm.configs().auth.enabled).toBe(true);
      expect(mm.configs().data.entities.users).toBeDefined();
   });

   test("partial config given, but db version exists", async () => {
      const c = getDummyConnection();
      const mm = new ModuleManager(c.dummyConnection);
      await mm.build();
      const json = mm.configs();

      const c2 = getDummyConnection();
      const db = c2.dummyConnection.kysely;

      const mm2 = new ModuleManager(c2.dummyConnection, {
         initial: {
            auth: {
               basepath: "/shouldnt/take/this"
            }
         }
      });
      await mm2.syncConfigTable();
      const payload = {
         ...json,
         auth: {
            ...json.auth,
            enabled: true,
            basepath: "/api/auth2"
         }
      };
      await db
         .insertInto(TABLE_NAME)
         .values({
            type: "config",
            json: JSON.stringify(payload),
            version: CURRENT_VERSION
         })
         .execute();
      await mm2.build();
      expect(mm2.configs().auth.basepath).toBe("/api/auth2");
   });
});
