import {
   SegmentedControl as $SegmentedControl,
   type SegmentedControlProps as $SegmentedControlProps,
   Input,
} from "@mantine/core";
import { type FieldValues, type UseControllerProps, useController } from "react-hook-form";

export type MantineSegmentedControlProps<T extends FieldValues> = UseControllerProps<T> &
   Omit<$SegmentedControlProps, "values" | "defaultValues"> & {
      label?: string;
      description?: string;
      error?: string;
   };

export function MantineSegmentedControl<T extends FieldValues>({
   name,
   control,
   defaultValue,
   rules,
   shouldUnregister,
   onChange,
   label,
   size,
   description,
   error,
   ...props
}: MantineSegmentedControlProps<T>) {
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
      <Input.Wrapper className="relative">
         {label && (
            <div className="flex flex-col">
               <Input.Label size={size}>{label}</Input.Label>
               {description && <Input.Description size={size}>{description}</Input.Description>}
            </div>
         )}
         <$SegmentedControl
            value={value}
            onChange={(e) => {
               fieldOnChange(e);
               onChange?.(e);
            }}
            size={size}
            {...field}
            {...props}
         />
      </Input.Wrapper>
   );
}
