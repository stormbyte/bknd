import JsonField from "./JsonField";
import LiquidJsField from "./LiquidJsField";
import MultiSchemaField from "./MultiSchemaField";

export const fields = {
   AnyOfField: MultiSchemaField,
   OneOfField: MultiSchemaField,
   JsonField,
   LiquidJsField,
};
