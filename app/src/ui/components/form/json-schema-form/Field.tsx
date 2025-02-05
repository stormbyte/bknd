import type { JSONSchema } from "json-schema-to-ts";
import type { ChangeEvent, ComponentPropsWithoutRef } from "react";
import * as Formy from "ui/components/form/Formy";
import { ArrayField } from "./ArrayField";
import { FieldWrapper } from "./FieldWrapper";
import { useFieldContext } from "./Form";
import { ObjectField } from "./ObjectField";
import { coerce, isType, isTypeSchema } from "./utils";

export type FieldProps = {
   name: string;
   schema?: Exclude<JSONSchema, boolean>;
   onChange?: (e: ChangeEvent<any>) => void;
   label?: string | false;
   hidden?: boolean;
};

export const Field = ({ name, schema: _schema, onChange, label: _label, hidden }: FieldProps) => {
   const { pointer, value, errors, setValue, required, ...ctx } = useFieldContext(name);
   const schema = _schema ?? ctx.schema;
   if (!isTypeSchema(schema)) return <Pre>{pointer} has no schema</Pre>;
   //console.log("field", name, schema);

   if (isType(schema.type, "object")) {
      return <ObjectField path={name} schema={schema} />;
   }

   if (isType(schema.type, "array")) {
      return <ArrayField path={name} schema={schema} />;
   }

   const disabled = schema.readOnly ?? "const" in schema ?? false;
   //console.log("field", name, disabled, schema, ctx.schema, _schema);

   function handleChange(e: ChangeEvent<HTMLInputElement>) {
      // don't remove for now, causes issues in anyOf
      /*const value = coerce(e.target.value, schema as any);
      setValue(pointer, value as any);*/

      const value = coerce(e.target.value, schema as any, { required });
      //console.log("handleChange", pointer, e.target.value, { value });
      if (typeof value === "undefined" && !required) {
         ctx.deleteValue(pointer);
      } else {
         setValue(pointer, value);
      }
   }

   return (
      <FieldWrapper
         pointer={pointer}
         label={_label}
         required={required}
         errors={errors}
         schema={schema}
         debug={{ value }}
         hidden={hidden}
      >
         <FieldComponent
            schema={schema}
            name={pointer}
            required={required}
            disabled={disabled}
            value={value}
            onChange={onChange ?? handleChange}
         />
      </FieldWrapper>
   );
};

export const Pre = ({ children }) => (
   <pre className="dark:bg-red-950 bg-red-100 rounded-md px-3 py-1.5">{children}</pre>
);

export const FieldComponent = ({
   schema,
   ...props
}: { schema: JSONSchema } & ComponentPropsWithoutRef<"input">) => {
   if (!schema || typeof schema === "boolean") return null;
   //console.log("field", props.name, props.disabled);

   if (schema.enum) {
      if (!Array.isArray(schema.enum)) return null;
      let options = schema.enum;
      if (schema.enum.every((v) => typeof v === "string")) {
         options = schema.enum.map((v, i) => ({ value: i, label: v }));
      }

      return <Formy.Select id={props.name} {...(props as any)} options={options} />;
   }

   if (isType(schema.type, ["number", "integer"])) {
      return <Formy.Input type="number" id={props.name} {...props} value={props.value ?? ""} />;
   }

   if (isType(schema.type, "boolean")) {
      return <Formy.Switch id={props.name} {...(props as any)} checked={props.value as any} />;
   }

   return <Formy.Input id={props.name} {...props} value={props.value ?? ""} />;
};
