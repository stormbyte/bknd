import { IconLibraryPlus, IconTrash } from "@tabler/icons-react";
import type { JSONSchema } from "json-schema-to-ts";
import { Button } from "ui/components/buttons/Button";
import { IconButton } from "ui/components/buttons/IconButton";
import * as Formy from "ui/components/form/Formy";
import { Dropdown } from "ui/components/overlay/Dropdown";
import { FieldComponent } from "./Field";
import { FieldWrapper } from "./FieldWrapper";
import { useFieldContext } from "./Form";
import { coerce, getMultiSchema, getMultiSchemaMatched } from "./utils";

export const ArrayField = ({
   path = "",
   schema: _schema
}: { path?: string; schema?: Exclude<JSONSchema, boolean> }) => {
   const { setValue, value, pointer, required, ...ctx } = useFieldContext(path);
   const schema = _schema ?? ctx.schema;
   if (!schema || typeof schema === "undefined") return `ArrayField(${path}): no schema ${pointer}`;

   const itemsMultiSchema = getMultiSchema(schema.items);

   function handleAdd(template?: any) {
      const currentIndex = value?.length ?? 0;
      const newPointer = `${path}/${currentIndex}`.replace(/\/+/g, "/");
      setValue(newPointer, template ?? ctx.lib.getTemplate(undefined, schema!.items));
   }

   function handleUpdate(pointer: string, value: any) {
      setValue(pointer, value);
   }

   function handleDelete(pointer: string) {
      return () => {
         ctx.deleteValue(pointer);
      };
   }

   // if unique items with enum
   if (schema.uniqueItems && typeof schema.items === "object" && "enum" in schema.items) {
      return (
         <FieldWrapper pointer={path} schema={schema} wrapper="fieldset">
            <FieldComponent
               required
               schema={schema.items}
               multiple
               value={value}
               className="h-auto"
               onChange={(e: any) => {
                  // @ts-ignore
                  const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
                  setValue(pointer, selected);
               }}
            />
         </FieldWrapper>
      );
   }

   return (
      <FieldWrapper pointer={path} schema={schema} wrapper="fieldset">
         {value?.map((v, index: number) => {
            const pointer = `${path}/${index}`.replace(/\/+/g, "/");
            let subschema = schema.items;
            if (itemsMultiSchema) {
               const [, , _subschema] = getMultiSchemaMatched(schema.items, v);
               subschema = _subschema;
            }

            return (
               <div key={pointer} className="flex flex-row gap-2">
                  <FieldComponent
                     name={pointer}
                     schema={subschema!}
                     value={v}
                     onChange={(e) => {
                        handleUpdate(pointer, coerce(e.target.value, subschema!));
                     }}
                     className="w-full"
                  />
                  <IconButton Icon={IconTrash} onClick={handleDelete(pointer)} size="sm" />
               </div>
            );
         })}
         <div className="flex flex-row">
            {itemsMultiSchema ? (
               <Dropdown
                  dropdownWrapperProps={{
                     className: "min-w-0"
                  }}
                  items={itemsMultiSchema.map((s, i) => ({
                     label: s!.title ?? `Option ${i + 1}`,
                     onClick: () => handleAdd(ctx.lib.getTemplate(undefined, s!))
                  }))}
                  onClickItem={console.log}
               >
                  <Button IconLeft={IconLibraryPlus}>Add</Button>
               </Dropdown>
            ) : (
               <Button onClick={() => handleAdd()}>Add</Button>
            )}
         </div>
      </FieldWrapper>
   );
};
