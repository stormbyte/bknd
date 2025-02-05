import { Draft2019, type JsonError, type JsonSchema as LibJsonSchema } from "json-schema-library";
import type { JSONSchema as $JSONSchema, FromSchema } from "json-schema-to-ts";
import {
   type ComponentPropsWithoutRef,
   type FormEvent,
   createContext,
   startTransition,
   useContext,
   useEffect,
   useMemo,
   useRef,
   useState
} from "react";
import { flatten, getFormTarget, isRequired, normalizePath, unflatten } from "./utils";

type JSONSchema = Exclude<$JSONSchema, boolean>;
type TFormData = Record<string, string>;

export type FormProps<
   Schema extends JSONSchema = JSONSchema,
   Data = Schema extends JSONSchema ? FromSchema<JSONSchema> : any
> = Omit<ComponentPropsWithoutRef<"form">, "onChange"> & {
   schema: Schema;
   validateOn?: "change" | "submit";
   initialValues?: Partial<Data>;
   onChange?: (data: Partial<Data>, name: string, value: any) => void;
   hiddenSubmit?: boolean;
};

export type FormContext = {
   data: TFormData;
   setData: (data: TFormData) => void;
   errors: JsonError[];
   schema: JSONSchema;
   lib: Draft2019;
   select: (pointer: string, choice: number | undefined) => void;
   selections: Record<string, number | undefined>;
};

const FormContext = createContext<FormContext>(undefined!);

export function Form<
   Schema extends JSONSchema = JSONSchema,
   Data = Schema extends JSONSchema ? FromSchema<JSONSchema> : any
>({
   schema: _schema,
   initialValues: _initialValues,
   children,
   onChange,
   validateOn = "submit",
   hiddenSubmit = true,
   ...props
}: FormProps<Schema, Data>) {
   const schema = useMemo(() => _schema, [JSON.stringify(_schema)]);
   const initialValues = useMemo(
      () => (_initialValues ? flatten(_initialValues) : {}),
      [JSON.stringify(_initialValues)]
   );

   const [data, setData] = useState<TFormData>(initialValues);
   const [errors, setErrors] = useState<JsonError[]>([]);
   const [selections, setSelections] = useState<Record<string, number | undefined>>({});
   const lib = new Draft2019(schema);
   const formRef = useRef<HTMLFormElement | null>(null);

   useEffect(() => {
      console.log("setting", initialValues);
      if (formRef.current) {
         Object.entries(initialValues).forEach(([name, value]) => {
            const pointer = normalizePath(name);
            const input = formRef.current?.elements.namedItem(pointer);
            if (input && "value" in input) {
               input.value = value as any;
            }
         });
      }
   }, [initialValues]);

   async function handleChange(e: FormEvent<HTMLFormElement>) {
      const target = getFormTarget(e);
      if (!target) return;
      const name = normalizePath(target.name);

      startTransition(() => {
         const newData = { ...data, [name]: target.value };
         setData(newData);

         const actual = unflatten(newData, schema, selections);
         if (validateOn === "change") {
            validate(actual);
         }

         onChange?.(actual, name, target.value);
      });
   }

   async function handleSubmit(e: FormEvent<HTMLFormElement>) {
      e.preventDefault();
      const actual = unflatten(data, schema, selections);
      const { data: newData, errors } = validate(actual);
      setData(newData);
      console.log("submit", newData, errors);
      return false;
   }

   function validate(_data?: object) {
      const actual = _data ?? unflatten(data, schema, selections);
      const errors = lib.validate(actual);
      console.log("validate", actual, errors);
      setErrors(errors);
      return {
         data: actual,
         errors
      };
   }

   function select(pathOrPointer: string, choice: number | undefined) {
      setSelections((prev) => ({ ...prev, [normalizePath(pathOrPointer)]: choice }));
   }

   const context = {
      data,
      setData,
      select,
      selections,
      errors,
      schema,
      lib
   };

   return (
      <>
         <form {...props} ref={formRef} onChange={handleChange} onSubmit={handleSubmit}>
            <FormContext.Provider value={context}>{children}</FormContext.Provider>
            {hiddenSubmit && (
               <button style={{ visibility: "hidden" }} type="submit">
                  Submit
               </button>
            )}
         </form>
         <pre>{JSON.stringify(data, null, 2)}</pre>
         <pre>{JSON.stringify(unflatten(data, schema, selections), null, 2)}</pre>
         <pre>{JSON.stringify(errors, null, 2)}</pre>
         <pre>{JSON.stringify(selections, null, 2)}</pre>
      </>
   );
}

export function useFormContext() {
   return useContext(FormContext);
}

export function useFieldContext(name: string) {
   const { data, setData, lib, schema, errors: formErrors, select, selections } = useFormContext();
   const pointer = normalizePath(name);
   //console.log("pointer", pointer);
   const value = data[pointer];
   const errors = formErrors.filter((error) => error.data.pointer === pointer);
   const fieldSchema = pointer === "#/" ? (schema as LibJsonSchema) : lib.getSchema({ pointer });
   const required = isRequired(pointer, schema);

   return {
      value,
      setValue: (value: any) => setData({ ...data, [name]: value }),
      errors,
      schema: fieldSchema,
      pointer,
      required,
      select,
      selections
   };
}

export function usePrefixContext(prefix: string) {
   const { data, setData, lib, schema, errors: formErrors, select, selections } = useFormContext();
   const pointer = normalizePath(prefix);
   const value = Object.fromEntries(Object.entries(data).filter(([key]) => key.startsWith(prefix)));
   const errors = formErrors.filter((error) => error.data.pointer.startsWith(pointer));
   const fieldSchema = pointer === "#/" ? (schema as LibJsonSchema) : lib.getSchema({ pointer });
   const required = isRequired(pointer, schema);

   return {
      value,
      //setValue: (value: any) => setData({ ...data, [name]: value }),
      errors,
      schema: fieldSchema,
      pointer,
      required,
      select,
      selections
   };
}
