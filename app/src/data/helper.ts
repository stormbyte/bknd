import type { EntityData, Field } from "data";
import { transform } from "lodash-es";

export function getDefaultValues(fields: Field[], data: EntityData): EntityData {
   return transform(
      fields,
      (acc, field) => {
         // form fields don't like "null" or "undefined", so return empty string
         acc[field.name] = field.getValue(data?.[field.name], "form") ?? "";
      },
      {} as EntityData
   );
}

export function getChangeSet(
   action: string,
   formData: EntityData,
   data: EntityData,
   fields: Field[]
): EntityData {
   return transform(
      formData,
      (acc, _value, key) => {
         const field = fields.find((f) => f.name === key);
         // @todo: filtering virtual here, need to check (because of media)
         if (!field || field.isVirtual()) return;
         const value = _value === "" ? null : _value;

         const newValue = field.getValue(value, "submit");
         // @todo: add typing for "action"
         if (action === "create" || newValue !== data[key]) {
            acc[key] = newValue;
            console.log("changed", {
               key,
               value,
               valueType: typeof value,
               prev: data[key],
               newValue,
               new: value,
               sent: acc[key]
            });
         } else {
            //console.log("no change", key, value, data[key]);
         }
      },
      {} as typeof formData
   );
}
