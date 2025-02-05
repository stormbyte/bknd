import type { JsonError } from "json-schema-library";
import type { JSONSchema } from "json-schema-to-ts";
import { AnyOfField } from "./AnyOfField";
import { Field } from "./Field";
import { FieldWrapper, type FieldwrapperProps } from "./FieldWrapper";
import { useFieldContext } from "./Form";

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
   const ctx = useFieldContext(path);
   const schema = _schema ?? ctx.schema;
   if (!schema) return "ObjectField: no schema";
   const properties = schema.properties ?? {};

   return (
      <FieldWrapper
         pointer={path}
         errors={ctx.errors}
         schema={{ ...schema, description: undefined }}
         wrapper="fieldset"
         {...wrapperProps}
      >
         {Object.keys(properties).map((prop) => {
            const schema = properties[prop];
            const pointer = `${path}/${prop}`.replace(/\/+/g, "/");
            if (!schema) return;

            if (schema.anyOf || schema.oneOf) {
               return <AnyOfField key={pointer} path={pointer} />;
            }

            return <Field key={pointer} name={pointer} />;
         })}
      </FieldWrapper>
   );
};
