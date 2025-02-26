import type { JSONSchema } from "json-schema-to-ts";
import { isTypeSchema } from "ui/components/form/json-schema-form/utils";
import { AnyOfField } from "./AnyOfField";
import { Field } from "./Field";
import { FieldWrapper, type FieldwrapperProps } from "./FieldWrapper";
import { useDerivedFieldContext } from "./Form";

export type ObjectFieldProps = {
   path?: string;
   label?: string | false;
   wrapperProps?: Partial<FieldwrapperProps>;
};

export const ObjectField = ({ path = "", label: _label, wrapperProps = {} }: ObjectFieldProps) => {
   const { schema } = useDerivedFieldContext(path);
   if (!isTypeSchema(schema)) return `ObjectField "${path}": no schema`;
   const properties = Object.entries(schema.properties ?? {}) as [string, JSONSchema][];

   return (
      <FieldWrapper
         name={path}
         schema={{ ...schema, description: undefined }}
         wrapper="fieldset"
         errorPlacement="top"
         {...wrapperProps}
      >
         {properties.length === 0 ? (
            <i className="opacity-50">No properties</i>
         ) : (
            properties.map(([prop, schema]) => {
               const name = [path, prop].filter(Boolean).join(".");
               if (typeof schema === "undefined" || typeof schema === "boolean") return;

               if (schema.anyOf || schema.oneOf) {
                  return <AnyOfField key={name} path={name} />;
               }

               return <Field key={name} name={name} />;
            })
         )}
      </FieldWrapper>
   );
};
