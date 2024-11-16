import { describe, expect, test } from "bun:test";
import { JsonSchemaField } from "../../../../src/data";
import { runBaseFieldTests } from "./inc";

describe("[data] JsonSchemaField", async () => {
   runBaseFieldTests(JsonSchemaField, { defaultValue: {}, schemaType: "text" });

   // @todo: add JsonSchemaField tests
});
