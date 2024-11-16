import { config } from "core";
import { type Static, Type } from "core/utils";
import { Field, baseFieldConfigSchema } from "./Field";

export const primaryFieldConfigSchema = Type.Composite([
   Type.Omit(baseFieldConfigSchema, ["required"]),
   Type.Object({
      required: Type.Optional(Type.Literal(false))
   })
]);

export type PrimaryFieldConfig = Static<typeof primaryFieldConfigSchema>;

export class PrimaryField<Required extends true | false = false> extends Field<
   PrimaryFieldConfig,
   string,
   Required
> {
   override readonly type = "primary";

   constructor(name: string = config.data.default_primary_field) {
      super(name, { fillable: false, required: false });
   }

   override isRequired(): boolean {
      return false;
   }

   protected getSchema() {
      return baseFieldConfigSchema;
   }

   schema() {
      return this.useSchemaHelper("integer", (col) => {
         return col.primaryKey().notNull().autoIncrement();
      });
   }

   override async transformPersist(value: any): Promise<number> {
      throw new Error("This function should not be called");
   }

   override toJsonSchema() {
      return this.toSchemaWrapIfRequired(Type.Number({ writeOnly: undefined }));
   }
}
