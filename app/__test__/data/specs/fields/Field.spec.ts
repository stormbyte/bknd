import { describe, expect, test } from "bun:test";
import { Default, parse, stripMark } from "../../../../src/core/utils";
import { Field, type SchemaResponse, TextField, baseFieldConfigSchema } from "../../../../src/data";
import { runBaseFieldTests, transformPersist } from "./inc";

describe("[data] Field", async () => {
   class FieldSpec extends Field {
      schema(): SchemaResponse {
         return this.useSchemaHelper("text");
      }
      getSchema() {
         return baseFieldConfigSchema;
      }
   }

   runBaseFieldTests(FieldSpec, { defaultValue: "test", schemaType: "text" });

   test("default config", async () => {
      const config = Default(baseFieldConfigSchema, {});
      expect(stripMark(new FieldSpec("test").config)).toEqual(config);
   });

   test("transformPersist (specific)", async () => {
      const required = new FieldSpec("test", { required: true });
      const requiredDefault = new FieldSpec("test", {
         required: true,
         default_value: "test",
      });

      expect(required.transformPersist(null, undefined as any, undefined as any)).rejects.toThrow();
      expect(
         required.transformPersist(undefined, undefined as any, undefined as any),
      ).rejects.toThrow();

      // works because it has a default value
      expect(
         requiredDefault.transformPersist(null, undefined as any, undefined as any),
      ).resolves.toBeDefined();
      expect(
         requiredDefault.transformPersist(undefined, undefined as any, undefined as any),
      ).resolves.toBeDefined();
   });
});
