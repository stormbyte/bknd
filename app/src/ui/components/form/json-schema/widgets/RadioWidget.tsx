import {
   type FormContextType,
   type RJSFSchema,
   type StrictRJSFSchema,
   type WidgetProps,
   ariaDescribedByIds,
   enumOptionsIsSelected,
   enumOptionsValueForIndex,
   optionId
} from "@rjsf/utils";
import { type FocusEvent, useCallback } from "react";

/** The `RadioWidget` is a widget for rendering a radio group.
 *  It is typically used with a string property constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
function RadioWidget<
   T = any,
   S extends StrictRJSFSchema = RJSFSchema,
   F extends FormContextType = any
>({
   options,
   value,
   required,
   disabled,
   readonly,
   autofocus = false,
   onBlur,
   onFocus,
   onChange,
   id
}: WidgetProps<T, S, F>) {
   const { enumOptions, enumDisabled, inline, emptyValue } = options;

   const handleBlur = useCallback(
      ({ target: { value } }: FocusEvent<HTMLInputElement>) =>
         onBlur(id, enumOptionsValueForIndex<S>(value, enumOptions, emptyValue)),
      [onBlur, id]
   );

   const handleFocus = useCallback(
      ({ target: { value } }: FocusEvent<HTMLInputElement>) =>
         onFocus(id, enumOptionsValueForIndex<S>(value, enumOptions, emptyValue)),
      [onFocus, id]
   );

   return (
      <div className="field-radio-group" id={id}>
         {Array.isArray(enumOptions) &&
            enumOptions.map((option, i) => {
               const checked = enumOptionsIsSelected<S>(option.value, value);
               const itemDisabled =
                  Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1;
               const disabledCls = disabled || itemDisabled || readonly ? "disabled" : "";

               const handleChange = () => onChange(option.value);

               const radio = (
                  // biome-ignore lint/correctness/useJsxKeyInIterable: <explanation>
                  <span>
                     <input
                        type="radio"
                        id={optionId(id, i)}
                        checked={checked}
                        name={id}
                        required={required}
                        value={String(i)}
                        disabled={disabled || itemDisabled || readonly}
                        autoFocus={autofocus && i === 0}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onFocus={handleFocus}
                        aria-describedby={ariaDescribedByIds<T>(id)}
                     />
                     <span>{option.label}</span>
                  </span>
               );

               return inline ? (
                  <label
                     key={i}
                     className={`radio-inline ${checked ? "checked" : ""} ${disabledCls}`}
                  >
                     {radio}
                  </label>
               ) : (
                  <div key={i} className={`radio ${checked ? "checked" : ""} ${disabledCls}`}>
                     <label>{radio}</label>
                  </div>
               );
            })}
      </div>
   );
}

export default RadioWidget;
