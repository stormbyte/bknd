import type { JSONSchema } from "json-schema-to-ts";
import { isTypeSchema } from "ui/components/form/json-schema-form/utils";
import { AnyOfField } from "./AnyOfField";
import { Field } from "./Field";
import { FieldWrapper, type FieldwrapperProps } from "./FieldWrapper";
import { useDerivedFieldContext } from "./Form";

export type ObjectFieldProps = {
   path?: string;
   schema?: Exclude<JSONSchema, boolean>;
   label?: string | false;
   wrapperProps?: Partial<FieldwrapperProps>;
};

export const ObjectField = ({
   path = "",
   schema: _schema,
   label: _label,
   wrapperProps = {}
}: ObjectFieldProps) => {
   const ctx = useDerivedFieldContext(path, _schema);
   const schema = _schema ?? ctx.schema;
   if (!isTypeSchema(schema)) return `ObjectField "${path}": no schema`;
   const properties = schema.properties ?? {};

   return (
      <FieldWrapper
         name={path}
         schema={{ ...schema, description: undefined }}
         wrapper="fieldset"
         {...wrapperProps}
      >
         {Object.keys(properties).map((prop) => {
            const schema = properties[prop];
            const name = [path, prop].filter(Boolean).join(".");
            if (typeof schema === "undefined" || typeof schema === "boolean") return;

            if (schema.anyOf || schema.oneOf) {
               return <AnyOfField key={name} path={name} />;
            }

            return <Field key={name} name={name} />;
         })}
      </FieldWrapper>
   );
};
