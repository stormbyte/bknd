import { describe, expect, test } from "bun:test";
import { parse } from "../../src/core/utils";
import { fieldsSchema } from "../../src/data/data-schema";
import { AppData } from "../../src/modules";
import { moduleTestSuite } from "./module-test-suite";

describe("AppData", () => {
   moduleTestSuite(AppData);

   test("field config construction", () => {
      expect(parse(fieldsSchema, { type: "text" })).toBeDefined();
   });
});
