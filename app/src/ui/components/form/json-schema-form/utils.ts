import { autoFormatString } from "core/utils";
import { Draft2019, type JsonSchema } from "json-schema-library";
import type { JSONSchema } from "json-schema-to-ts";
import type { JSONSchemaType } from "json-schema-to-ts/lib/types/definitions/jsonSchema";
import { set } from "lodash-es";
import type { FormEvent } from "react";

export function getFormTarget(e: FormEvent<HTMLFormElement>) {
   const form = e.currentTarget;
   const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;

   // check if target has attribute "data-ignore" set
   // also check if target is within a "data-ignore" element

   if (
      !target ||
      !form.contains(target) ||
      !target.name ||
      target.hasAttribute("data-ignore") ||
      target.closest("[data-ignore]")
   ) {
      return; // Ignore events from outside the form
   }
   return target;
}

export function flatten(obj: any, parentKey = "", result: any = {}): any {
   for (const key in obj) {
      if (key in obj) {
         const newKey = parentKey ? `${parentKey}/${key}` : "#/" + key;
         if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
            flatten(obj[key], newKey, result);
         } else if (Array.isArray(obj[key])) {
            obj[key].forEach((item, index) => {
               const arrayKey = `${newKey}.${index}`;
               if (typeof item === "object" && item !== null) {
                  flatten(item, arrayKey, result);
               } else {
                  result[arrayKey] = item;
               }
            });
         } else {
            result[newKey] = obj[key];
         }
      }
   }
   return result;
}

// @todo: make sure it's in the right order
export function unflatten(
   obj: Record<string, string>,
   schema: JSONSchema,
   selections?: Record<string, number | undefined>
) {
   const result = {};
   const lib = new Draft2019(schema as any);
   for (const pointer in obj) {
      const required = isRequired(pointer, schema);
      let subschema = lib.getSchema({ pointer });
      console.log("subschema", pointer, subschema, selections);
      if (!subschema) {
         throw new Error(`"${pointer}" not found in schema`);
      }

      // if subschema starts with "anyOf" or "oneOf"
      if (subschema.anyOf || subschema.oneOf) {
         const selected = selections?.[pointer];
         if (selected !== undefined) {
            subschema = subschema.anyOf ? subschema.anyOf[selected] : subschema.oneOf![selected];
         }
      }

      const value = coerce(obj[pointer], subschema as any, { required });

      set(result, pointer.substring(2).replace(/\//g, "."), value);
   }
   return result;
}

export function coerce(
   value: any,
   schema: Exclude<JSONSchema, boolean>,
   opts?: { required?: boolean }
) {
   if (!value && typeof opts?.required === "boolean" && !opts.required) {
      return undefined;
   }

   switch (schema.type) {
      case "string":
         return String(value);
      case "integer":
      case "number":
         return Number(value);
      case "boolean":
         return ["true", "1", 1, "on"].includes(value);
      case "null":
         return null;
   }

   return value;
}

/**
 * normalizes any path to a full json pointer
 *
 * examples: in -> out
 * description -> #/description
 * #/description -> #/description
 * /description -> #/description
 * nested/property -> #/nested/property
 * nested.property -> #/nested/property
 * nested.property[0] -> #/nested/property/0
 * nested.property[0].name -> #/nested/property/0/name
 * @param path
 */
export function normalizePath(path: string) {
   return path.startsWith("#/")
      ? path
      : `#/${path.replace(/#?\/?/, "").replace(/\./g, "/").replace(/\[/g, "/").replace(/\]/g, "")}`;
}

export function prefixPointer(pointer: string, prefix: string) {
   return pointer.replace("#/", `#/${prefix}/`).replace(/\/\//g, "/");
}

export function getParentPointer(pointer: string) {
   return pointer.substring(0, pointer.lastIndexOf("/"));
}

export function isRequired(pointer: string, schema: JSONSchema, data?: any) {
   if (pointer === "#/") {
      return false;
   }
   const lib = new Draft2019(schema as any);

   const childSchema = lib.getSchema({ pointer, data });
   if (typeof childSchema === "object" && ("const" in childSchema || "enum" in childSchema)) {
      return true;
   }

   const parentPointer = getParentPointer(pointer);
   const parentSchema = lib.getSchema({ pointer: parentPointer, data });
   const required = parentSchema?.required?.includes(pointer.split("/").pop()!);

   /*console.log("isRequired", {
      pointer,
      parentPointer,
      parent: parentSchema ? JSON.parse(JSON.stringify(parentSchema)) : null,
      required
   });*/

   return !!required;
}

type TType = JSONSchemaType | JSONSchemaType[] | readonly JSONSchemaType[] | undefined;
export function isType(_type: TType, _compare: TType) {
   if (!_type || !_compare) return false;
   const type = Array.isArray(_type) ? _type : [_type];
   const compare = Array.isArray(_compare) ? _compare : [_compare];
   return compare.some((t) => type.includes(t));
}

export function getLabel(name: string, schema: JSONSchema) {
   if (typeof schema === "object" && "title" in schema) return schema.title;
   const label = name.includes("/") ? (name.split("/").pop() ?? "") : name;
   return autoFormatString(label);
}

export function getMultiSchema(schema: JSONSchema): Exclude<JSONSchema, boolean>[] | undefined {
   if (!schema || typeof schema !== "object") return;
   return (schema.anyOf ?? schema.oneOf) as any;
}

export function getMultiSchemaMatched(
   schema: JsonSchema,
   data: any
): [number, Exclude<JSONSchema, boolean>[], Exclude<JSONSchema, boolean> | undefined] {
   const multiSchema = getMultiSchema(schema);
   if (!multiSchema) return [-1, [], undefined];
   const index = multiSchema.findIndex((subschema) => {
      const lib = new Draft2019(subschema as any);
      return lib.validate(data, subschema).length === 0;
   });
   if (index === -1) return [-1, multiSchema, undefined];

   return [index, multiSchema, multiSchema[index]];
}

export function removeKeyRecursively<Given extends object>(obj: Given, keyToRemove: string): Given {
   if (Array.isArray(obj)) {
      return obj.map((item) => removeKeyRecursively(item, keyToRemove)) as any;
   } else if (typeof obj === "object" && obj !== null) {
      return Object.fromEntries(
         Object.entries(obj)
            .filter(([key]) => key !== keyToRemove)
            .map(([key, value]) => [key, removeKeyRecursively(value, keyToRemove)])
      ) as any;
   }
   return obj;
}
