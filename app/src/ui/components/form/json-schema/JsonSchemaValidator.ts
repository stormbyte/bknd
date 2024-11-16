import { type OutputUnit, Validator } from "@cfworker/json-schema";
import type {
   CustomValidator,
   ErrorSchema,
   ErrorTransformer,
   FormContextType,
   RJSFSchema,
   RJSFValidationError,
   StrictRJSFSchema,
   UiSchema,
   ValidationData,
   ValidatorType
} from "@rjsf/utils";
import { toErrorSchema } from "@rjsf/utils";
import get from "lodash-es/get";

function removeUndefinedKeys(obj: any): any {
   if (!obj) return obj;

   if (typeof obj === "object") {
      Object.keys(obj).forEach((key) => {
         if (obj[key] === undefined) {
            delete obj[key];
         } else if (typeof obj[key] === "object") {
            removeUndefinedKeys(obj[key]);
         }
      });
   }

   if (Array.isArray(obj)) {
      return obj.filter((item) => item !== undefined);
   }

   return obj;
}

function onlyKeepMostSpecific(errors: OutputUnit[]) {
   const mostSpecific = errors.filter((error) => {
      return !errors.some((other) => {
         return error !== other && other.instanceLocation.startsWith(error.instanceLocation);
      });
   });
   return mostSpecific;
}

const debug = true;
const validate = true;

export class JsonSchemaValidator<
   T = any,
   S extends StrictRJSFSchema = RJSFSchema,
   F extends FormContextType = any
> implements ValidatorType
{
   // @ts-ignore
   rawValidation<Result extends OutputUnit = OutputUnit>(schema: S, formData?: T) {
      if (!validate) return { errors: [], validationError: null };

      debug && console.log("JsonSchemaValidator.rawValidation", schema, formData);
      const validator = new Validator(schema as any);
      const validation = validator.validate(removeUndefinedKeys(formData));
      const specificErrors = onlyKeepMostSpecific(validation.errors);

      return { errors: specificErrors, validationError: null as any };
   }

   validateFormData(
      formData: T | undefined,
      schema: S,
      customValidate?: CustomValidator,
      transformErrors?: ErrorTransformer,
      uiSchema?: UiSchema
   ): ValidationData<T> {
      if (!validate) return { errors: [], errorSchema: {} as any };

      debug &&
         console.log(
            "JsonSchemaValidator.validateFormData",
            formData,
            schema,
            customValidate,
            transformErrors,
            uiSchema
         );
      const { errors } = this.rawValidation(schema, formData);
      debug && console.log("errors", { errors });

      const transformedErrors = errors
         //.filter((error) => error.keyword !== "properties")
         .map((error) => {
            const schemaLocation = error.keywordLocation.replace(/^#\/?/, "").split("/").join(".");
            const propertyError = get(schema, schemaLocation);
            const errorText = `${error.error.replace(/\.$/, "")}${propertyError ? ` "${propertyError}"` : ""}`;
            //console.log(error, schemaLocation, get(schema, schemaLocation));
            return {
               name: error.keyword,
               message: errorText,
               property: "." + error.instanceLocation.replace(/^#\/?/, "").split("/").join("."),
               schemaPath: error.keywordLocation,
               stack: error.error
            };
         });
      debug && console.log("transformed", transformedErrors);

      return {
         errors: transformedErrors,
         errorSchema: toErrorSchema(transformedErrors)
      } as any;
   }

   toErrorList(errorSchema?: ErrorSchema<T>, fieldPath?: string[]): RJSFValidationError[] {
      debug && console.log("JsonSchemaValidator.toErrorList", errorSchema, fieldPath);
      return [];
   }

   isValid(schema: S, formData: T | undefined, rootSchema: S): boolean {
      if (!validate) return true;
      debug && console.log("JsonSchemaValidator.isValid", schema, formData, rootSchema);
      return this.rawValidation(schema, formData).errors.length === 0;
   }
}
