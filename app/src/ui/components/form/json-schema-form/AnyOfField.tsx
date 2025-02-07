import { atom, useAtom } from "jotai";
import type { JsonError, JsonSchema } from "json-schema-library";
import { type ChangeEvent, type ReactNode, createContext, useContext, useMemo } from "react";
import { twMerge } from "tailwind-merge";
import * as Formy from "ui/components/form/Formy";
import { useEvent } from "ui/hooks/use-event";
import { FieldComponent, Field as FormField, type FieldProps as FormFieldProps } from "./Field";
import { FormContextOverride, useDerivedFieldContext } from "./Form";
import { getLabel, getMultiSchemaMatched } from "./utils";

export type AnyOfFieldRootProps = {
   path?: string;
   schema?: JsonSchema;
   children: ReactNode;
};

export type AnyOfFieldContext = {
   path: string;
   schema: JsonSchema;
   schemas?: JsonSchema[];
   selectedSchema?: JsonSchema;
   selected: number | null;
   select: (index: number | null) => void;
   options: string[];
   errors: JsonError[];
   selectSchema: JsonSchema;
};

const AnyOfContext = createContext<AnyOfFieldContext>(undefined!);

export const useAnyOfContext = () => {
   return useContext(AnyOfContext);
};

const selectedAtom = atom<number | null>(null);

const Root = ({ path = "", schema: _schema, children }: AnyOfFieldRootProps) => {
   const {
      setValue,
      lib,
      pointer,
      errors,
      value: { matchedIndex, schemas },
      schema
   } = useDerivedFieldContext(path, _schema, (ctx) => {
      const [matchedIndex, schemas = []] = getMultiSchemaMatched(ctx.schema, ctx.value);
      return { matchedIndex, schemas };
   });
   if (!schema) return `AnyOfField(${path}): no schema ${pointer}`;
   const [_selected, setSelected] = useAtom(selectedAtom);
   const selected = _selected !== null ? _selected : matchedIndex > -1 ? matchedIndex : null;

   const select = useEvent((index: number | null) => {
      setValue(pointer, index !== null ? lib.getTemplate(undefined, schemas[index]) : undefined);
      setSelected(index);
   });

   const context = useMemo(() => {
      const options = schemas.map((s, i) => s.title ?? `Option ${i + 1}`);
      const selectSchema = {
         type: "string",
         enum: options
      } satisfies JsonSchema;

      const selectedSchema = selected !== null ? (schemas[selected] as JsonSchema) : undefined;

      return {
         options,
         selectSchema,
         selectedSchema,
         schema,
         schemas,
         selected
      };
   }, [selected]);

   return (
      <AnyOfContext.Provider
         key={selected}
         value={{
            ...context,
            select,
            path,
            errors
         }}
      >
         {children}
      </AnyOfContext.Provider>
   );
};

const Select = () => {
   const { selected, select, path, schema, options, selectSchema } = useAnyOfContext();

   function handleSelect(e: ChangeEvent<HTMLInputElement>) {
      const i = e.target.value ? Number(e.target.value) : null;
      select(i);
   }

   return (
      <>
         <Formy.Label>
            {getLabel(path, schema)} {selected}
         </Formy.Label>
         <FieldComponent
            schema={selectSchema as any}
            /* @ts-ignore */
            options={options.map((label, value) => ({ label, value }))}
            onChange={handleSelect}
            value={selected ?? undefined}
            className="h-8 py-1"
         />
      </>
   );
};

const Field = ({ name, label, schema, ...props }: Partial<FormFieldProps>) => {
   const { selected, selectedSchema, path, errors } = useAnyOfContext();
   if (selected === null) return null;
   return (
      <FormContextOverride prefix={path} schema={selectedSchema}>
         <div className={twMerge(errors.length > 0 && "bg-red-500/10")}>
            <FormField key={`${path}_${selected}`} name={""} label={false} {...props} />
         </div>
      </FormContextOverride>
   );
};

export const AnyOf = {
   Root,
   Select,
   Field,
   useContext: useAnyOfContext
};

export const AnyOfField = (props: Omit<AnyOfFieldRootProps, "children">) => {
   return (
      <fieldset>
         <AnyOf.Root {...props}>
            <legend className="flex flex-row gap-2 items-center py-2">
               <AnyOf.Select />
            </legend>
            <AnyOf.Field />
         </AnyOf.Root>
      </fieldset>
   );
};
