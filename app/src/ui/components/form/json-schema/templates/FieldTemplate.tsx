import {
   type FieldTemplateProps,
   type FormContextType,
   type RJSFSchema,
   type StrictRJSFSchema,
   getTemplate,
   getUiOptions,
} from "@rjsf/utils";
import { identifierToHumanReadable } from "core/utils";
import { twMerge } from "tailwind-merge";

const REQUIRED_FIELD_SYMBOL = "*";

export type LabelProps = {
   /** The label for the field */
   label?: string;
   /** A boolean value stating if the field is required */
   required?: boolean;
   /** The id of the input field being labeled */
   id?: string;
};

/** Renders a label for a field
 *
 * @param props - The `LabelProps` for this component
 */
export function Label(props: LabelProps) {
   const { label, required, id } = props;
   if (!label) {
      return null;
   }
   return (
      <label className="control-label" htmlFor={id}>
         {identifierToHumanReadable(label)}
         {required && <span className="required">{REQUIRED_FIELD_SYMBOL}</span>}
      </label>
   );
}

/** The `FieldTemplate` component is the template used by `SchemaField` to render any field. It renders the field
 * content, (label, description, children, errors and help) inside of a `WrapIfAdditional` component.
 *
 * @param props - The `FieldTemplateProps` for this component
 */
export function FieldTemplate<
   T = any,
   S extends StrictRJSFSchema = RJSFSchema,
   F extends FormContextType = any,
>(props: FieldTemplateProps<T, S, F>) {
   const {
      id,
      label,
      children,
      errors,
      help,
      description,
      hidden,
      required,
      displayLabel,
      registry,
      uiSchema,
   } = props;
   const uiOptions = getUiOptions(uiSchema, registry.globalUiOptions);
   //console.log("field---", uiOptions);
   const WrapIfAdditionalTemplate = getTemplate<"WrapIfAdditionalTemplate", T, S, F>(
      "WrapIfAdditionalTemplate",
      registry,
      uiOptions,
   );
   if (hidden) {
      return <div className="hidden">{children}</div>;
   }
   //console.log("FieldTemplate", props);

   return (
      <WrapIfAdditionalTemplate {...props}>
         {/*<Label label={label} required={required} id={id} />*/}
         <div className="flex flex-col flex-grow gap-2 additional">
            <div
               className={twMerge(
                  "flex flex-grow additional-children",
                  uiOptions.flexDirection === "row"
                     ? "flex-row items-center gap-3"
                     : "flex-col flex-grow gap-2",
               )}
            >
               {children}
            </div>
            {displayLabel && description ? description : null}
         </div>
         {errors}
         {help}
      </WrapIfAdditionalTemplate>
   );
}
