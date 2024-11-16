import { describe, expect, test } from "bun:test";
import { mark, stripMark } from "../src/core/utils";
import { ModuleManager } from "../src/modules/ModuleManager";
import { CURRENT_VERSION, TABLE_NAME, migrateSchema } from "../src/modules/migrations";
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
      await migrateSchema(CURRENT_VERSION, { db });
      await db
         .updateTable(TABLE_NAME)
         .set({ json: JSON.stringify(json), version: CURRENT_VERSION })
         .execute();

      const mm2 = new ModuleManager(c2.dummyConnection, { initial: { version, ...json } });
      await mm2.build();

      expect(json).toEqual(mm2.configs());
   });

   test("s4: config given, table exists, version outdated, migrate", async () => {
      const c = getDummyConnection();
      const mm = new ModuleManager(c.dummyConnection);
      await mm.build();
      const version = mm.version();
      const json = mm.configs();
      //const { version, ...json } = mm.toJSON() as any;

      const c2 = getDummyConnection();
      const db = c2.dummyConnection.kysely;
      console.log("here2");
      await migrateSchema(CURRENT_VERSION, { db });
      await db
         .updateTable(TABLE_NAME)
         .set({ json: JSON.stringify(json), version: CURRENT_VERSION - 1 })
         .execute();

      const mm2 = new ModuleManager(c2.dummyConnection, {
         initial: { version: version - 1, ...json }
      });
      console.log("here3");
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
      await migrateSchema(CURRENT_VERSION, { db });
      await db
         .updateTable(TABLE_NAME)
         .set({ json: JSON.stringify(json), version: CURRENT_VERSION })
         .execute();

      const mm2 = new ModuleManager(c2.dummyConnection, {
         initial: { version: version - 1, ...json }
      });

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
      await migrateSchema(CURRENT_VERSION, { db });

      const config = {
         ...json,
         data: {
            ...json.data,
            basepath: "/api/data2"
         }
      };
      await db
         .updateTable(TABLE_NAME)
         .set({ json: JSON.stringify(config), version: CURRENT_VERSION })
         .execute();

      // run without config given
      const mm2 = new ModuleManager(c2.dummyConnection);
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

   // @todo: check what happens here
   /*test("blank app, modify deep config", async () => {
      const { dummyConnection } = getDummyConnection();

      const mm = new ModuleManager(dummyConnection);
      await mm.build();

      /!* await mm
         .get("data")
         .schema()
         .patch("entities.test", {
            fields: {
               content: {
                  type: "text"
               }
            }
         });
      await mm.build();

      expect(mm.configs().data.entities?.users?.fields?.email.type).toBe("text");

      expect(
         mm.get("data").schema().patch("desc", "entities.users.config.sort_dir")
      ).rejects.toThrow();
      await mm.build();*!/
      expect(mm.configs().data.entities?.users?.fields?.email.type).toBe("text");
      console.log("here", mm.configs());
      await mm
         .get("data")
         .schema()
         .patch("entities.users", { config: { sort_dir: "desc" } });
      await mm.build();
      expect(mm.toJSON());

      //console.log(_jsonp(mm.toJSON().data));
      /!*expect(mm.configs().data.entities!.test!.fields!.content.type).toBe("text");
      expect(mm.configs().data.entities!.users!.config!.sort_dir).toBe("desc");*!/
   });*/

   /*test("accessing modules", async () => {
      const { dummyConnection } = getDummyConnection();

      const mm = new ModuleManager(dummyConnection);

      //mm.get("auth").mutate().set({});
   });*/
});
