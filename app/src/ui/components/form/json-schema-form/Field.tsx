import type { JsonSchema } from "json-schema-library";
import type { ChangeEvent, ComponentPropsWithoutRef } from "react";
import ErrorBoundary from "ui/components/display/ErrorBoundary";
import * as Formy from "ui/components/form/Formy";
import { useEvent } from "ui/hooks/use-event";
import { ArrayField } from "./ArrayField";
import { FieldWrapper, type FieldwrapperProps } from "./FieldWrapper";
import { useDerivedFieldContext, useFormValue } from "./Form";
import { ObjectField } from "./ObjectField";
import { coerce, isType, isTypeSchema } from "./utils";

export type FieldProps = {
   onChange?: (e: ChangeEvent<any>) => void;
   placeholder?: string;
} & Omit<FieldwrapperProps, "children" | "schema">;

export const Field = (props: FieldProps) => {
   return (
      <ErrorBoundary fallback={fieldErrorBoundary(props)}>
         <FieldImpl {...props} />
      </ErrorBoundary>
   );
};

const fieldErrorBoundary =
   ({ name }: FieldProps) =>
   ({ error }: { error: Error }) => (
      <Pre>
         Field "{name}" error: {error.message}
      </Pre>
   );

const FieldImpl = ({ name, onChange, placeholder, ...props }: FieldProps) => {
   const { path, setValue, required, schema, ...ctx } = useDerivedFieldContext(name);
   //console.log("Field", { name, path, schema });
   if (!isTypeSchema(schema))
      return (
         <Pre>
            [Field] {path} has no schema ({JSON.stringify(schema)})
         </Pre>
      );

   if (isType(schema.type, "object")) {
      return <ObjectField path={name} />;
   }

   if (isType(schema.type, "array")) {
      return <ArrayField path={name} />;
   }

   const disabled = schema.readOnly ?? "const" in schema ?? false;

   const handleChange = useEvent((e: ChangeEvent<HTMLInputElement>) => {
      const value = coerce(e.target.value, schema as any, { required });
      if (typeof value === "undefined" && !required && ctx.options?.keepEmpty !== true) {
         ctx.deleteValue(path);
      } else {
         setValue(path, value);
      }
   });

   return (
      <FieldWrapper name={name} required={required} schema={schema} {...props}>
         <FieldComponent
            schema={schema}
            name={name}
            required={required}
            disabled={disabled}
            placeholder={placeholder}
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
   const { value } = useFormValue(_props.name!, { strict: true });
   if (!isTypeSchema(schema)) return null;
   const props = {
      ..._props,
      // allow override
      value: typeof _props.value !== "undefined" ? _props.value : value,
      placeholder:
         (_props.placeholder ?? typeof schema.default !== "undefined") ? String(schema.default) : ""
   };

   if (schema.enum) {
      return <Formy.Select id={props.name} options={schema.enum} {...(props as any)} />;
   }

   if (isType(schema.type, ["number", "integer"])) {
      const additional = {
         min: schema.minimum,
         max: schema.maximum,
         step: schema.multipleOf
      };

      return (
         <Formy.Input
            type="number"
            id={props.name}
            {...props}
            value={props.value ?? ""}
            {...additional}
         />
      );
   }

   if (isType(schema.type, "boolean")) {
      return <Formy.Switch id={props.name} {...(props as any)} checked={value === true} />;
   }

   if (isType(schema.type, "string") && schema.format === "date-time") {
      const value = props.value ? new Date(props.value as string).toISOString().slice(0, 16) : "";
      return (
         <Formy.DateInput
            id={props.name}
            {...props}
            value={value}
            type="datetime-local"
            onChange={(e) => {
               const date = new Date(e.target.value);
               props.onChange?.({
                  // @ts-ignore
                  target: { value: date.toISOString() }
               });
            }}
         />
      );
   }

   if (isType(schema.type, "string") && schema.format === "date") {
      return <Formy.DateInput id={props.name} {...props} value={props.value ?? ""} />;
   }

   const additional = {
      maxLength: schema.maxLength,
      minLength: schema.minLength,
      pattern: schema.pattern
   } as any;

   if (schema.format) {
      if (["password", "hidden", "url", "email", "tel"].includes(schema.format)) {
         additional.type = schema.format;
      }
   }

   return <Formy.Input id={props.name} {...props} value={props.value ?? ""} {...additional} />;
};
