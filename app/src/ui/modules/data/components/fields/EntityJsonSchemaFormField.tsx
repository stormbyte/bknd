import type { FieldApi } from "@tanstack/react-form";
import type { EntityData, JsonSchemaField } from "data";
import { Suspense, lazy } from "react";
import * as Formy from "ui/components/form/Formy";
import { FieldLabel } from "ui/components/form/Formy";

const JsonSchemaForm = lazy(() =>
   import("ui/components/form/json-schema/JsonSchemaForm").then((m) => ({
      default: m.JsonSchemaForm
   }))
);

export function EntityJsonSchemaFormField({
   fieldApi,
   field,
   data,
   disabled,
   ...props
}: {
   fieldApi: FieldApi<any, any>;
   field: JsonSchemaField;
   data?: EntityData;
   disabled?: boolean;
   tabIndex?: number;
}) {
   function handleChange(value: any) {
      if (disabled) return;
      fieldApi.setValue(value);
   }

   const formData = data?.[field.name];
   //console.log("formData", { disabled, formData });

   return (
      <Formy.Group>
         <FieldLabel htmlFor={fieldApi.name} field={field} />
         <Suspense fallback={<div>Loading...</div>}>
            <div
               data-disabled={disabled ? 1 : undefined}
               className="data-[disabled]:opacity-70 data-[disabled]:pointer-events-none"
            >
               <JsonSchemaForm
                  schema={field.getJsonSchema()}
                  onChange={handleChange}
                  direction="horizontal"
                  formData={formData}
                  uiSchema={{
                     "ui:globalOptions": { flexDirection: "row" },
                     ...field.getJsonUiSchema()
                  }}
               />
            </div>
         </Suspense>
      </Formy.Group>
   );
}
