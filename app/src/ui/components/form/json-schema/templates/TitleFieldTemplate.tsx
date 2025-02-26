import type { FormContextType, RJSFSchema, StrictRJSFSchema, TitleFieldProps } from "@rjsf/utils";
import { ucFirstAllSnakeToPascalWithSpaces } from "core/utils";

const REQUIRED_FIELD_SYMBOL = "*";

/** The `TitleField` is the template to use to render the title of a field
 *
 * @param props - The `TitleFieldProps` for this component
 */
export default function TitleField<
   T = any,
   S extends StrictRJSFSchema = RJSFSchema,
   F extends FormContextType = any,
>(props: TitleFieldProps<T, S, F>) {
   const { id, title, required } = props;
   return (
      <legend id={id} className="title-field">
         {ucFirstAllSnakeToPascalWithSpaces(title)}
         {/*{required && <span className="required">{REQUIRED_FIELD_SYMBOL}</span>}*/}
      </legend>
   );
}
