import { describe, expect, test } from "bun:test";
import { type TSchema, Type, stripMark } from "../src/core/utils";
import { Module } from "../src/modules/Module";

function createModule<Schema extends TSchema>(schema: Schema) {
   class TestModule extends Module<typeof schema> {
      getSchema() {
         return schema;
      }
      toJSON() {
         return this.config;
      }
      useForceParse() {
         return true;
      }
   }

   return TestModule;
}

describe("Module", async () => {
   test("basic", async () => {});

   test("listener", async () => {
      let result: any;

      const module = createModule(Type.Object({ a: Type.String() }));
      const m = new module({ a: "test" });

      await m.schema().set({ a: "test2" });
      m.setListener(async (c) => {
         await new Promise((r) => setTimeout(r, 10));
         result = stripMark(c);
      });
      await m.schema().set({ a: "test3" });
      expect(result).toEqual({ a: "test3" });
   });
});
