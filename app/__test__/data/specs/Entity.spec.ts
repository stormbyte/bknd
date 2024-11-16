import { describe, expect, test } from "bun:test";
import { Entity, NumberField, TextField } from "../../../src/data";

describe("[data] Entity", async () => {
   const entity = new Entity("test", [
      new TextField("name", { required: true }),
      new TextField("description"),
      new NumberField("age", { fillable: false, default_value: 18 }),
      new TextField("hidden", { hidden: true, default_value: "secret" })
   ]);

   test("getSelect", async () => {
      expect(entity.getSelect()).toEqual(["id", "name", "description", "age"]);
   });

   test("getFillableFields", async () => {
      expect(entity.getFillableFields().map((f) => f.name)).toEqual([
         "name",
         "description",
         "hidden"
      ]);
   });

   test("getRequiredFields", async () => {
      expect(entity.getRequiredFields().map((f) => f.name)).toEqual(["name"]);
   });

   test("getDefaultObject", async () => {
      expect(entity.getDefaultObject()).toEqual({
         age: 18,
         hidden: "secret"
      });
   });

   test("getField", async () => {
      expect(entity.getField("name")).toBeInstanceOf(TextField);
      expect(entity.getField("age")).toBeInstanceOf(NumberField);
   });

   test("getPrimaryField", async () => {
      expect(entity.getPrimaryField().name).toEqual("id");
   });

   test("addField", async () => {
      const field = new TextField("new_field");
      entity.addField(field);
      expect(entity.getField("new_field")).toBe(field);
   });

   // @todo: move this to ClientApp
   /*test("serialize and deserialize", async () => {
      const json = entity.toJSON();
      //sconsole.log("json", json.fields);
      const newEntity = Entity.deserialize(json);
      //console.log("newEntity", newEntity.toJSON().fields);
      expect(newEntity).toBeInstanceOf(Entity);
      expect(json).toEqual(newEntity.toJSON());
      expect(json.fields).toEqual(newEntity.toJSON().fields);
   });*/
});
