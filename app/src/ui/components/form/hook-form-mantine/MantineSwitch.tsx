import { Switch as $Switch, type SwitchProps as $SwitchProps } from "@mantine/core";
import { type FieldValues, type UseControllerProps, useController } from "react-hook-form";

export type SwitchProps<T extends FieldValues> = UseControllerProps<T> &
   Omit<$SwitchProps, "value" | "checked" | "defaultValue">;

export function MantineSwitch<T extends FieldValues>({
   name,
   control,
   defaultValue,
   rules,
   shouldUnregister,
   onChange,
   ...props
}: SwitchProps<T>) {
   const {
      field: { value, onChange: fieldOnChange, ...field },
      fieldState,
   } = useController<T>({
      name,
      control,
      defaultValue,
      rules,
      shouldUnregister,
   });

   return (
      <$Switch
         value={value}
         checked={value}
         onChange={(e) => {
            fieldOnChange(e);
            onChange?.(e);
         }}
         error={fieldState.error?.message}
         {...field}
         {...props}
      />
   );
}
