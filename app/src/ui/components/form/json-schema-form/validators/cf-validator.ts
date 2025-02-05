import { type Schema as JsonSchema, type OutputUnit, Validator } from "@cfworker/json-schema";
import type { Validator as TValidator } from "json-schema-form-react";

export class CfValidator implements TValidator<OutputUnit> {
   async validate(schema: JsonSchema, data: any) {
      const result = new Validator(schema).validate(data);
      return result.errors;
   }
}

export type { OutputUnit };
