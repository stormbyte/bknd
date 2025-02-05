import type { ValueError } from "@sinclair/typebox/value";
import { type TSchema, Value } from "core/utils";
import type { Validator } from "json-schema-form-react";

export class TypeboxValidator implements Validator<ValueError> {
   async validate(schema: TSchema, data: any) {
      return Value.Check(schema, data) ? [] : [...Value.Errors(schema, data)];
   }
}

export type { ValueError };
