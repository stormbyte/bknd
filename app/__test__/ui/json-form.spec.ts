import { describe, expect, test } from "bun:test";
import { Draft2019 } from "json-schema-library";
import type { JSONSchema } from "json-schema-to-ts";
import * as utils from "../../src/ui/components/form/json-schema-form/utils";

describe("json form", () => {
   test("normalize path", () => {
      const examples = [
         ["description", "#/description"],
         ["/description", "#/description"],
         ["nested/property", "#/nested/property"],
         ["nested.property", "#/nested/property"],
         ["nested.property[0]", "#/nested/property/0"],
         ["nested.property[0].name", "#/nested/property/0/name"]
      ];

      for (const [input, output] of examples) {
         expect(utils.normalizePath(input)).toBe(output);
      }
   });

   test("coerse", () => {
      const examples = [
         ["test", { type: "string" }, "test"],
         ["1", { type: "integer" }, 1],
         ["1", { type: "number" }, 1],
         ["true", { type: "boolean" }, true],
         ["false", { type: "boolean" }, false],
         ["1", { type: "boolean" }, true],
         ["0", { type: "boolean" }, false],
         ["on", { type: "boolean" }, true],
         ["off", { type: "boolean" }, false],
         ["null", { type: "null" }, null]
      ] satisfies [string, Exclude<JSONSchema, boolean>, any][];

      for (const [input, schema, output] of examples) {
         expect(utils.coerce(input, schema)).toBe(output);
      }
   });

   test("getParentPointer", () => {
      const examples = [
         ["#/nested/property/0/name", "#/nested/property/0"],
         ["#/nested/property/0", "#/nested/property"],
         ["#/nested/property", "#/nested"],
         ["#/nested", "#"]
      ];

      for (const [input, output] of examples) {
         expect(utils.getParentPointer(input)).toBe(output);
      }
   });

   test("isRequired", () => {
      const examples = [
         [
            "#/description",
            { type: "object", properties: { description: { type: "string" } } },
            false
         ],
         [
            "#/description",
            {
               type: "object",
               required: ["description"],
               properties: { description: { type: "string" } }
            },
            true
         ],
         [
            "#/nested/property",
            {
               type: "object",
               properties: {
                  nested: {
                     type: "object",
                     properties: { property: { type: "string" } }
                  }
               }
            },
            false
         ],
         [
            "#/nested/property",
            {
               type: "object",
               properties: {
                  nested: {
                     type: "object",
                     required: ["property"],
                     properties: { property: { type: "string" } }
                  }
               }
            },
            true
         ]
      ] satisfies [string, Exclude<JSONSchema, boolean>, boolean][];

      for (const [pointer, schema, output] of examples) {
         expect(utils.isRequired(pointer, schema)).toBe(output);
      }
   });

   test("unflatten", () => {
      const examples = [
         [
            { "#/description": "test" },
            {
               type: "object",
               properties: {
                  description: { type: "string" }
               }
            },
            {
               description: "test"
            }
         ]
      ] satisfies [Record<string, string>, Exclude<JSONSchema, boolean>, object][];

      for (const [input, schema, output] of examples) {
         expect(utils.unflatten(input, schema)).toEqual(output);
      }
   });

   test("...", () => {
      const schema = {
         type: "object",
         properties: {
            name: { type: "string", maxLength: 2 },
            description: { type: "string", maxLength: 2 },
            age: { type: "number", description: "Age of you" },
            deep: {
               type: "object",
               properties: {
                  nested: { type: "string", maxLength: 2 }
               }
            }
         },
         required: ["description"]
      };

      //const lib = new Draft2019(schema);
      //lib.eachSchema(console.log);
   });
});
