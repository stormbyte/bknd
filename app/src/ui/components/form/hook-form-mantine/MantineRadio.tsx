import {
   Radio as $Radio,
   RadioGroup as $RadioGroup,
   type RadioGroupProps as $RadioGroupProps,
   type RadioProps as $RadioProps,
} from "@mantine/core";
import { type FieldValues, type UseControllerProps, useController } from "react-hook-form";

export type RadioProps<T extends FieldValues> = UseControllerProps<T> &
   Omit<$RadioProps, "value" | "defaultValue">;

export function MantineRadio<T extends FieldValues>({
   name,
   control,
   defaultValue,
   rules,
   shouldUnregister,
   onChange,
   ...props
}: RadioProps<T>) {
   const {
      field: { value, onChange: fieldOnChange, ...field },
   } = useController<T>({
      name,
      control,
      defaultValue,
      rules,
      shouldUnregister,
   });

   return (
      <$Radio
         value={value}
         onChange={(e) => {
            fieldOnChange(e);
            onChange?.(e);
         }}
         {...field}
         {...props}
      />
   );
}

export type RadioGroupProps<T extends FieldValues> = UseControllerProps<T> &
   Omit<$RadioGroupProps, "value" | "defaultValue">;

function RadioGroup<T extends FieldValues>({
   name,
   control,
   defaultValue,
   rules,
   shouldUnregister,
   onChange,
   ...props
}: RadioGroupProps<T>) {
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
      <$RadioGroup
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

MantineRadio.Group = RadioGroup;
MantineRadio.Item = $Radio;
