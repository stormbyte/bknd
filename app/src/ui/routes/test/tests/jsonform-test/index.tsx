import Form from "@rjsf/core";
import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import { useRef } from "react";
import { TbPlus, TbTrash } from "react-icons/tb";
import { Button } from "../../../../components/buttons/Button";
import * as Formy from "../../../../components/form/Formy";
import {
   JsonSchemaForm,
   type JsonSchemaFormRef
} from "../../../../components/form/json-schema/JsonSchemaForm";
import * as AppShell from "../../../../layouts/AppShell/AppShell";

class CfJsonSchemaValidator {}

export default function JsonFormTest() {
   const schema: RJSFSchema = {
      type: "object",
      properties: {
         name: {
            type: "string",
            title: "Name",
            minLength: 3
         },
         variants: {
            anyOf: [{ type: "string" }, { type: "number" }]
         }
      }
   };
   const ref = useRef<JsonSchemaFormRef>(null);

   function onSubmit() {
      console.log("submit", ref.current?.formData());
      console.log("isvalid", ref.current?.validateForm());
   }

   return (
      <>
         <AppShell.SectionHeader
            right={
               <Button type="button" variant="primary" onClick={onSubmit}>
                  Submit
               </Button>
            }
         >
            JSON Schema
         </AppShell.SectionHeader>
         <div>
            <div className="flex flex-grow flex-col gap-3 p-3">
               <Formy.Group>
                  <Formy.Label htmlFor="name">Name</Formy.Label>
                  <Formy.Input id="name" name="name" />
               </Formy.Group>
               <Formy.Group>
                  <JsonSchemaForm ref={ref} schema={schema} />
               </Formy.Group>

               <Formy.Group>
                  <Formy.Label htmlFor="name">Options</Formy.Label>
                  <Formy.Select id="options" name="options" />
               </Formy.Group>
            </div>
         </div>
      </>
   );
}
