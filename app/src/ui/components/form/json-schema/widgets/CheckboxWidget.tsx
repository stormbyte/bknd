import { Switch } from "@mantine/core";
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from "@rjsf/utils";
import { type ChangeEvent, useCallback } from "react";

export function CheckboxWidget<
   T = any,
   S extends StrictRJSFSchema = RJSFSchema,
   F extends FormContextType = any
>({
   schema,
   uiSchema,
   options,
   id,
   value,
   disabled,
   readonly,
   label,
   hideLabel,
   autofocus = false,
   onBlur,
   onFocus,
   onChange,
   registry,
   ...props
}: WidgetProps<T, S, F>) {
   /*console.log("addprops", value, props, label, {
      label,
      name: props.name,
      hideLabel,
      label_lower: label.toLowerCase(),
      name_lower: props.name.toLowerCase(),
      equals: label.toLowerCase() === props.name.toLowerCase()
   });*/
   const handleChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => onChange(event.target.checked),
      [onChange]
   );

   return (
      <Switch
         id={id}
         onChange={handleChange}
         defaultChecked={value}
         disabled={disabled || readonly}
         label={label.toLowerCase() === props.name.toLowerCase() ? undefined : label}
      />
   );
}
