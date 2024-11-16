import { describe, expect, test } from "bun:test";
import { BooleanField } from "../../../../src/data";
import { runBaseFieldTests, transformPersist } from "./inc";

describe("[data] BooleanField", async () => {
   runBaseFieldTests(BooleanField, { defaultValue: true, schemaType: "boolean" });

   test("transformRetrieve", async () => {
      const field = new BooleanField("test");
      expect(field.transformRetrieve(1)).toBe(true);
      expect(field.transformRetrieve(0)).toBe(false);
      expect(field.transformRetrieve("1")).toBe(true);
      expect(field.transformRetrieve("0")).toBe(false);
      expect(field.transformRetrieve(true)).toBe(true);
      expect(field.transformRetrieve(false)).toBe(false);
      expect(field.transformRetrieve(null)).toBe(null);
      expect(field.transformRetrieve(undefined)).toBe(null);
   });

   test("transformPersist (specific)", async () => {
      const field = new BooleanField("test");
      expect(transformPersist(field, 1)).resolves.toBe(true);
      expect(transformPersist(field, 0)).resolves.toBe(false);
      expect(transformPersist(field, "1")).rejects.toThrow();
      expect(transformPersist(field, "0")).rejects.toThrow();
      expect(transformPersist(field, true)).resolves.toBe(true);
      expect(transformPersist(field, false)).resolves.toBe(false);
   });
});
