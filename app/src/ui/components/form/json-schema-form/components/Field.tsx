import { Switch } from "@mantine/core";
import { autoFormatString } from "core/utils";
import { type JSONSchema, useFieldContext, useFormContext } from "json-schema-form-react";
import type { ComponentPropsWithoutRef } from "react";
import * as Formy from "ui/components/form/Formy";

// make a local version of JSONSchema that is always an object
export type FieldProps = JSONSchema & {
   name: string;
   defaultValue?: any;
   hidden?: boolean;
   overrides?: ComponentPropsWithoutRef<"input">;
};

export function Field(p: FieldProps) {
   const { schema, defaultValue, required } = useFieldContext(p.name);
   const props = {
      ...(typeof schema === "object" ? schema : {}),
      defaultValue,
      required,
      ...p
   } as FieldProps;
   console.log("schema", p.name, schema, defaultValue);

   const field = renderField(props);
   const label = props.title
      ? props.title
      : autoFormatString(
           props.name?.includes(".") ? (props.name.split(".").pop() as string) : props.name
        );

   return p.hidden ? (
      field
   ) : (
      <Formy.Group>
         <Formy.Label>
            {label}
            {props.required ? " *" : ""}
         </Formy.Label>
         {field}
         {props.description ? <Formy.Help>{props.description}</Formy.Help> : null}
      </Formy.Group>
   );
}

function isType(_type: JSONSchema["type"], _compare: JSONSchema["type"]) {
   if (!_type || !_compare) return false;
   const type = Array.isArray(_type) ? _type : [_type];
   const compare = Array.isArray(_compare) ? _compare : [_compare];
   return compare.some((t) => type.includes(t));
}

function renderField(props: FieldProps) {
   //console.log("renderField", props.name, props);
   const common = {
      name: props.name,
      defaultValue: typeof props.defaultValue !== "undefined" ? props.defaultValue : props.default
   } as any;

   if (props.hidden) {
      common.type = "hidden";
   }

   if (isType(props.type, "boolean")) {
      return (
         <div className="flex flex-row">
            <Switch
               disabled={props.disabled}
               id={props.id}
               defaultChecked={props.defaultValue}
               name={props.name}
            />
         </div>
      );
   } else if (isType(props.type, ["number", "integer"])) {
      return <Formy.Input type="number" {...common} />;
   }

   return <Formy.Input type="text" {...common} />;
}

export function AutoForm({ schema, prefix = "" }: { schema: JSONSchema; prefix?: string }) {
   const required = schema.required ?? [];
   const properties = schema.properties ?? {};

   return (
      <>
         {/*<pre>{JSON.stringify(schema, null, 2)}</pre>;*/}
         <div>
            {Object.keys(properties).map((name) => {
               const field = properties[name];
               const _name = `${prefix ? prefix + "." : ""}${name}`;
               return <Field key={_name} name={_name} {...(field as any)} />;
            })}
         </div>
      </>
   );
}
