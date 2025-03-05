import {
   NumberInput as $NumberInput,
   type NumberInputProps as $NumberInputProps,
} from "@mantine/core";
import { type FieldValues, type UseControllerProps, useController } from "react-hook-form";

export type MantineNumberInputProps<T extends FieldValues> = UseControllerProps<T> &
   Omit<$NumberInputProps, "value" | "defaultValue">;

export function MantineNumberInput<T extends FieldValues>({
   name,
   control,
   defaultValue,
   rules,
   shouldUnregister,
   onChange,
   ...props
}: MantineNumberInputProps<T>) {
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
      <$NumberInput
         value={value}
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
