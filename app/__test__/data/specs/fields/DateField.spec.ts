import { describe, expect, test } from "bun:test";
import { DateField } from "../../../../src/data";
import { runBaseFieldTests } from "./inc";

describe("[data] DateField", async () => {
   runBaseFieldTests(DateField, { defaultValue: new Date(), schemaType: "date" });

   // @todo: add datefield tests
   test("week", async () => {
      const field = new DateField("test", { type: "week" });
      console.log(field.getValue("2021-W01", "submit"));
   });
});
