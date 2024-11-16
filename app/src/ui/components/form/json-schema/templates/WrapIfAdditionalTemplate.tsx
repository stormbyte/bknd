import {
   ADDITIONAL_PROPERTY_FLAG,
   type FormContextType,
   type RJSFSchema,
   type StrictRJSFSchema,
   TranslatableString,
   type WrapIfAdditionalTemplateProps
} from "@rjsf/utils";
import { useState } from "react";

/** The `WrapIfAdditional` component is used by the `FieldTemplate` to rename, or remove properties that are
 * part of an `additionalProperties` part of a schema.
 *
 * @param props - The `WrapIfAdditionalProps` for this component
 */
export default function WrapIfAdditionalTemplate<
   T = any,
   S extends StrictRJSFSchema = RJSFSchema,
   F extends FormContextType = any
>(props: WrapIfAdditionalTemplateProps<T, S, F>) {
   const {
      id,
      classNames,
      style,
      disabled,
      label,
      onKeyChange,
      onDropPropertyClick,
      readonly,
      required,
      schema,
      children,
      uiSchema,
      registry
   } = props;
   const { templates, translateString } = registry;
   // Button templates are not overridden in the uiSchema
   const { RemoveButton } = templates.ButtonTemplates;
   const keyLabel = translateString(TranslatableString.KeyLabel, [label]);
   const additional = ADDITIONAL_PROPERTY_FLAG in schema;
   const [expanded, setExpanded] = useState(true);

   if (!additional) {
      return (
         <div className={classNames} style={style}>
            {children}
         </div>
      );
   }

   return (
      <div className={classNames} style={style}>
         <div className="flex flex-col">
            <fieldset>
               <legend className="flex flex-row justify-between gap-3">
                  <RemoveButton
                     className="array-item-remove btn-block"
                     style={{ border: "0" }}
                     disabled={disabled || readonly}
                     onClick={onDropPropertyClick(label)}
                     uiSchema={uiSchema}
                     registry={registry}
                  />
                  <div className="form-group">
                     <input
                        className="form-control"
                        type="text"
                        id={`${id}-key`}
                        onBlur={(event) => onKeyChange(event.target.value)}
                        defaultValue={label}
                     />
                  </div>
                  <button onClick={() => setExpanded((prev) => !prev)}>
                     {expanded ? "collapse" : "expand"}
                  </button>
               </legend>
               {expanded && (
                  <div className="form-additional additional-start form-group">{children}</div>
               )}
            </fieldset>
         </div>
      </div>
   );
}
