import { decodeSearch, encodeSearch, mergeObject, parseDecode } from "core/utils";
import { isEqual, transform } from "lodash-es";
import { useLocation, useSearch as useWouterSearch } from "wouter";
import { type s, parse, cloneSchema } from "core/object/schema";

// @todo: migrate to Typebox
export function useSearch<Schema extends s.TAnySchema = s.TAnySchema>(
   _schema: Schema,
   defaultValue?: Partial<s.StaticCoerced<Schema>>,
) {
   const schema = cloneSchema(_schema as any) as s.TSchema;
   const searchString = useWouterSearch();
   const [location, navigate] = useLocation();
   const initial = searchString.length > 0 ? decodeSearch(searchString) : (defaultValue ?? {});
   const value = parse(schema, initial, {
      withDefaults: true,
      clone: true,
   }) as s.StaticCoerced<Schema>;

   // @ts-ignore
   const _defaults = mergeObject(schema.template({ withOptional: true }), defaultValue ?? {});

   function set<Update extends Partial<s.StaticCoerced<Schema>>>(update: Update): void {
      // @ts-ignore
      if (schema.validate(update).valid) {
         const search = getWithoutDefaults(mergeObject(value, update), _defaults);
         const encoded = encodeSearch(search, { encode: false });
         navigate(location + (encoded.length > 0 ? "?" + encoded : ""));
      }
   }

   return {
      value: value as Required<s.StaticCoerced<Schema>>,
      set,
   };
}

function getWithoutDefaults(value: object, defaultValue: object) {
   return transform(
      value as any,
      (result, value, key) => {
         if (defaultValue && isEqual(value, defaultValue[key])) return;
         result[key] = value;
      },
      {} as object,
   );
}
