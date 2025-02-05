import { Popover } from "@mantine/core";
import { IconBug } from "@tabler/icons-react";
import { autoFormatString } from "core/utils";
import type { JSONSchema } from "json-schema-to-ts";
import { type ChangeEvent, type ComponentPropsWithoutRef, useState } from "react";
import { IconButton } from "ui/components/buttons/IconButton";
import { JsonViewer } from "ui/components/code/JsonViewer";
import * as Formy from "ui/components/form/Formy";
import { ErrorMessage } from "ui/components/form/Formy";
import {
   Form,
   useFieldContext,
   useFormContext,
   usePrefixContext
} from "ui/components/form/json-schema-form2/Form";
import { isType } from "ui/components/form/json-schema-form2/utils";

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
   }
   //required: ["description"]
} as const satisfies JSONSchema;

const simpleSchema = {
   type: "object",
   properties: {
      tags: {
         type: "array",
         items: {
            type: "string"
         }
      }
   }
} as const satisfies JSONSchema;

export default function JsonSchemaForm2() {
   return (
      <div className="flex flex-col p-3">
         <h1>Form</h1>

         {/*<Form
            schema={schema}
            onChange={console.log}
            validateOn="change"
            className="flex flex-col gap-2"
         >
            <input name="name" placeholder="name" />
            <Field name="age" />
            <Field name="description" />
            <input name="deep/nested" placeholder="deep/nested" />

            <div className="border border-red-500 p-3">
               <ObjectField prefix="deep" />
            </div>
         </Form>

         <hr />*/}

         {/*<Form
            schema={{
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
               }
            }}
            onChange={console.log}
            initialValues={{ age: 12, deep: { nested: "test" } }}
            validateOn="change"
            className="flex flex-col gap-2"
         >
            <AutoForm />
         </Form>*/}
         {/*<Form
            schema={{
               type: "object",
               properties: {
                  bla: { type: "string" },
                  type: { type: "string", enum: ["a", "b"] }
               }
            }}
            onChange={console.log}
            validateOn="change"
            className="flex flex-col gap-2"
         >
            <AutoForm />
         </Form>*/}

         <Form
            schema={{
               type: "object",
               properties: {
                  bla: {
                     anyOf: [
                        { type: "string", maxLength: 2, title: "String" },
                        { type: "number", title: "Number" }
                     ]
                  }
               }
            }}
            onChange={console.log}
            validateOn="change"
            className="flex flex-col gap-2"
         >
            <AutoForm />
         </Form>

         {/*<Form schema={simpleSchema} validateOn="change" className="flex flex-col gap-2">
            <AutoForm />
         </Form>*/}
      </div>
   );
}

const Field = ({
   name = "",
   schema: _schema
}: { name?: string; schema?: Exclude<JSONSchema, boolean> }) => {
   const { value, errors, pointer, required, ...ctx } = useFieldContext(name);
   const schema = _schema ?? ctx.schema;
   if (!schema) return `"${name}" (${pointer}) has no schema`;

   if (isType(schema.type, ["object", "array"])) {
      return null;
   }

   const label = schema.title ?? name; //autoFormatString(name.split("/").pop());

   return (
      <Formy.Group error={errors.length > 0}>
         <Formy.Label>
            {label} {required ? "*" : ""}
         </Formy.Label>
         <div className="flex flex-row gap-2">
            <div className="flex flex-1 flex-col">
               <FieldComponent
                  schema={schema}
                  name={pointer}
                  placeholder={pointer}
                  required={required}
               />
            </div>
            <Popover>
               <Popover.Target>
                  <IconButton Icon={IconBug} />
               </Popover.Target>
               <Popover.Dropdown>
                  <JsonViewer
                     json={{ pointer, value, required, schema, errors }}
                     expand={6}
                     className="p-0"
                  />
               </Popover.Dropdown>
            </Popover>
         </div>
         {schema.description && <Formy.Help>{schema.description}</Formy.Help>}
         {errors.length > 0 && (
            <Formy.ErrorMessage>{errors.map((e) => e.message).join(", ")}</Formy.ErrorMessage>
         )}
      </Formy.Group>
   );
};

const FieldComponent = ({
   schema,
   ...props
}: { schema: JSONSchema } & ComponentPropsWithoutRef<"input">) => {
   if (!schema || typeof schema === "boolean") return null;

   const common = {};

   if (schema.enum) {
      if (!Array.isArray(schema.enum)) return null;

      return <Formy.Select {...(props as any)} options={schema.enum} />;
   }

   if (isType(schema.type, ["number", "integer"])) {
      return <Formy.Input type="number" {...props} />;
   }

   return <Formy.Input {...props} />;
};

const ObjectField = ({ path = "" }: { path?: string }) => {
   const { schema } = usePrefixContext(path);
   if (!schema) return null;
   const properties = schema.properties ?? {};
   const label = schema.title ?? path;
   console.log("object", { path, schema, properties });

   return (
      <fieldset className="border border-muted p-3 flex flex-col gap-2">
         <legend>Object: {label}</legend>
         {Object.keys(properties).map((prop) => {
            const schema = properties[prop];
            const pointer = `${path}/${prop}`;

            console.log("--", prop, pointer, schema);
            if (schema.anyOf || schema.oneOf) {
               return <AnyOfField key={pointer} path={pointer} />;
            }

            if (isType(schema.type, "object")) {
               console.log("object", { prop, pointer, schema });
               return <ObjectField key={pointer} path={pointer} />;
            }

            if (isType(schema.type, "array")) {
               return <ArrayField key={pointer} path={pointer} />;
            }

            return <Field key={pointer} name={pointer} />;
         })}
      </fieldset>
   );
};

const AnyOfField = ({ path = "" }: { path?: string }) => {
   const [selected, setSelected] = useState<number | null>(null);
   const { schema, select } = usePrefixContext(path);
   if (!schema) return null;
   const schemas = schema.anyOf ?? schema.oneOf ?? [];
   const options = schemas.map((s, i) => ({
      value: i,
      label: s.title ?? `Option ${i + 1}`
   }));
   const selectSchema = {
      enum: options
   };

   function handleSelect(e: ChangeEvent<HTMLInputElement>) {
      const i = e.target.value ? Number(e.target.value) : null;
      setSelected(i);
      select(path, i !== null ? i : undefined);
   }
   console.log("options", options, schemas, selected !== null && schemas[selected]);

   return (
      <>
         <div>
            anyOf: {path} ({selected})
         </div>
         <FieldComponent schema={selectSchema as any} onChange={handleSelect} />

         {selected !== null && (
            <Field key={`${path}_${selected}`} schema={schemas[selected]} name={path} />
         )}
      </>
   );
};

const ArrayField = ({ path = "" }: { path?: string }) => {
   return "array: " + path;
};

const AutoForm = ({ prefix = "" }: { prefix?: string }) => {
   const { schema } = usePrefixContext(prefix);
   if (!schema) return null;

   if (isType(schema.type, "object")) {
      return <ObjectField path={prefix} />;
   }

   if (isType(schema.type, "array")) {
      return <ArrayField path={prefix} />;
   }

   return <Field name={prefix} />;
};
