import { Draft2019, type JsonError } from "json-schema-library";
import type { TemplateOptions as LibTemplateOptions } from "json-schema-library/dist/lib/getTemplate";
import type { JsonSchema as LibJsonSchema } from "json-schema-library/dist/lib/types";
import type { JSONSchema as $JSONSchema, FromSchema } from "json-schema-to-ts";
import { get } from "lodash-es";
import * as immutable from "object-path-immutable";
import {
   type ComponentPropsWithoutRef,
   type FormEvent,
   type ReactNode,
   createContext,
   useContext,
   useEffect,
   useRef,
   useState
} from "react";
import { Field } from "./Field";
import { isRequired, normalizePath, prefixPointer } from "./utils";

type JSONSchema = Exclude<$JSONSchema, boolean>;

export type FormProps<
   Schema extends JSONSchema = JSONSchema,
   Data = Schema extends JSONSchema ? FromSchema<JSONSchema> : any
> = Omit<ComponentPropsWithoutRef<"form">, "onChange"> & {
   schema: Schema;
   validateOn?: "change" | "submit";
   initialValues?: Partial<Data>;
   initialOpts?: LibTemplateOptions;
   onChange?: (data: Partial<Data>, name: string, value: any) => void;
   hiddenSubmit?: boolean;
};

export type FormContext<Data> = {
   data: Data;
   setData: (data: Data) => void;
   setValue: (pointer: string, value: any) => void;
   deleteValue: (pointer: string) => void;
   errors: JsonError[];
   schema: JSONSchema;
   lib: Draft2019;
};

const FormContext = createContext<FormContext<any>>(undefined!);

export function Form<
   Schema extends JSONSchema = JSONSchema,
   Data = Schema extends JSONSchema ? FromSchema<JSONSchema> : any
>({
   schema,
   initialValues,
   initialOpts,
   children,
   onChange,
   validateOn = "submit",
   hiddenSubmit = true,
   ...props
}: FormProps<Schema, Data>) {
   const lib = new Draft2019(schema);
   const [data, setData] = useState<Partial<Data>>(
      initialValues ?? lib.getTemplate(undefined, schema, initialOpts)
   );
   const formRef = useRef<HTMLFormElement | null>(null);
   const [errors, setErrors] = useState<JsonError[]>([]);

   async function handleChange(e: FormEvent<HTMLFormElement>) {}

   async function handleSubmit(e: FormEvent<HTMLFormElement>) {
      e.preventDefault();
      return false;
   }

   function setValue(pointer: string, value: any) {
      const normalized = normalizePath(pointer);
      console.log("setValue", { pointer, normalized, value });
      const key = normalized.substring(2).replace(/\//g, ".");
      setData((prev) => {
         const changed = immutable.set(prev, key, value);
         //console.log("changed", prev, changed, { key, value });
         return changed;
      });
   }

   function deleteValue(pointer: string) {
      const normalized = normalizePath(pointer);
      const key = normalized.substring(2).replace(/\//g, ".");
      setData((prev) => {
         const changed = immutable.del(prev, key);
         //console.log("changed", prev, changed, { key });
         return changed;
      });
   }

   useEffect(() => {
      if (validateOn === "change") {
         validate();
      }
   }, [data]);

   function validate(_data?: Partial<Data>) {
      const actual = _data ?? data;
      const errors = lib.validate(actual, schema);
      //console.log("errors", errors);
      setErrors(errors);
      return { data: actual, errors };
   }

   const context = {
      data: data ?? {},
      setData,
      setValue,
      deleteValue,
      errors,
      schema,
      lib
   } as any;
   //console.log("context", context);

   return (
      <>
         <form {...props} ref={formRef} onChange={handleChange} onSubmit={handleSubmit}>
            <FormContext.Provider value={context}>
               {children ? children : <Field name="" />}
            </FormContext.Provider>
            {hiddenSubmit && (
               <button style={{ visibility: "hidden" }} type="submit">
                  Submit
               </button>
            )}
         </form>
         <pre>{JSON.stringify(data, null, 2)}</pre>
         <pre>{JSON.stringify(errors, null, 2)}</pre>
      </>
   );
}

export function useFormContext() {
   return useContext(FormContext);
}

export function FormContextOverride({
   children,
   overrideData,
   path,
   ...overrides
}: Partial<FormContext<any>> & { children: ReactNode; path?: string; overrideData?: boolean }) {
   const ctx = useFormContext();
   const additional: Partial<FormContext<any>> = {};

   // this makes a local schema down the three
   // especially useful for AnyOf, since it doesn't need to fully validate (e.g. pattern)
   if (overrideData && path) {
      const pointer = normalizePath(path);
      const value =
         pointer === "#/" ? ctx.data : get(ctx.data, pointer.substring(2).replace(/\//g, "."));

      additional.data = value;
      additional.setValue = (pointer: string, value: any) => {
         ctx.setValue(prefixPointer(pointer, path), value);
      };
      additional.deleteValue = (pointer: string) => {
         ctx.deleteValue(prefixPointer(pointer, path));
      };
   }

   const context = {
      ...ctx,
      ...overrides,
      ...additional
   };

   return <FormContext.Provider value={context}>{children}</FormContext.Provider>;
}

export function useFieldContext(name: string) {
   const { data, lib, schema, errors: formErrors, ...rest } = useFormContext();
   const pointer = normalizePath(name);
   const isRootPointer = pointer === "#/";
   //console.log("pointer", pointer);
   const value = isRootPointer ? data : get(data, pointer.substring(2).replace(/\//g, "."));
   const errors = formErrors.filter((error) => error.data.pointer.startsWith(pointer));
   const fieldSchema = isRootPointer
      ? (schema as LibJsonSchema)
      : lib.getSchema({ pointer, data, schema });
   const required = isRequired(pointer, schema, data);

   return {
      ...rest,
      lib,
      value,
      errors,
      schema: fieldSchema,
      pointer,
      required
   };
}
