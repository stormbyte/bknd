import type { JsonSchema } from "json-schema-library";
import type { ChangeEvent, ComponentPropsWithoutRef } from "react";
import * as Formy from "ui/components/form/Formy";
import { useEvent } from "ui/hooks/use-event";
import { ArrayField } from "./ArrayField";
import { FieldWrapper } from "./FieldWrapper";
import { useDerivedFieldContext, useFormValue } from "./Form";
import { ObjectField } from "./ObjectField";
import { coerce, isType, isTypeSchema } from "./utils";

export type FieldProps = {
   name: string;
   schema?: JsonSchema;
   onChange?: (e: ChangeEvent<any>) => void;
   label?: string | false;
   hidden?: boolean;
};

export const Field = ({ name, schema: _schema, onChange, label: _label, hidden }: FieldProps) => {
   const { pointer, setValue, required, ...ctx } = useDerivedFieldContext(name, _schema);
   const schema = _schema ?? ctx.schema;
   if (!isTypeSchema(schema))
      return (
         <Pre>
            [Field] {pointer} has no schema ({JSON.stringify(schema)})
         </Pre>
      );

   if (isType(schema.type, "object")) {
      return <ObjectField path={name} schema={schema} />;
   }

   if (isType(schema.type, "array")) {
      return <ArrayField path={name} schema={schema} />;
   }

   const disabled = schema.readOnly ?? "const" in schema ?? false;

   const handleChange = useEvent((e: ChangeEvent<HTMLInputElement>) => {
      const value = coerce(e.target.value, schema as any, { required });
      if (typeof value === "undefined" && !required && ctx.options?.keepEmpty !== true) {
         ctx.deleteValue(pointer);
      } else {
         setValue(pointer, value);
      }
   });

   return (
      <FieldWrapper name={name} label={_label} required={required} schema={schema} hidden={hidden}>
         <FieldComponent
            schema={schema}
            name={name}
            required={required}
            disabled={disabled}
            onChange={onChange ?? handleChange}
         />
      </FieldWrapper>
   );
};

export const Pre = ({ children }) => (
   <pre className="dark:bg-red-950 bg-red-100 rounded-md px-3 py-1.5 text-wrap whitespace-break-spaces  break-all">
      {children}
   </pre>
);

export const FieldComponent = ({
   schema,
   ..._props
}: { schema: JsonSchema } & ComponentPropsWithoutRef<"input">) => {
   const { value } = useFormValue(_props.name!);
   if (!isTypeSchema(schema)) return null;
   const props = {
      ..._props,
      // allow override
      value: typeof _props.value !== "undefined" ? _props.value : value
   };

   if (schema.enum) {
      return <Formy.Select id={props.name} options={schema.enum} {...(props as any)} />;
   }

   if (isType(schema.type, ["number", "integer"])) {
      return <Formy.Input type="number" id={props.name} {...props} value={props.value ?? ""} />;
   }

   if (isType(schema.type, "boolean")) {
      return <Formy.Switch id={props.name} {...(props as any)} checked={value as any} />;
   }

   return <Formy.Input id={props.name} {...props} value={props.value ?? ""} />;
};
