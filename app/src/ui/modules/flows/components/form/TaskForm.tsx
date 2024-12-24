import type { Task } from "flows";
import { JsonSchemaForm } from "ui/components/form/json-schema";

export type TaskFormProps = {
   task: Task;
   onChange?: (values: any) => void;
   [key: string]: any;
};

export function TaskForm({ task, onChange, ...props }: TaskFormProps) {
   // @ts-ignore
   const schema = task.constructor.schema;
   const params = task.params;
   const uiSchema = Object.fromEntries(
      Object.keys(schema.properties).map((key) => {
         return [key, { "ui:field": "template", "ui:fieldReplacesAnyOrOneOf": true }];
      })
   );
   //console.log("uiSchema", uiSchema);

   return (
      <JsonSchemaForm
         className="legacy"
         schema={schema}
         onChange={onChange}
         formData={params}
         {...props}
         /*uiSchema={uiSchema}*/
         /*fields={{ template: TemplateField }}*/
      />
   );
}
