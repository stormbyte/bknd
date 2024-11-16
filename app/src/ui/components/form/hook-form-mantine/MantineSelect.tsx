import { Select, type SelectProps } from "@mantine/core";
import { type FieldValues, type UseControllerProps, useController } from "react-hook-form";

export type MantineSelectProps<T extends FieldValues> = UseControllerProps<T> &
   Omit<SelectProps, "value" | "defaultValue">;

// @todo: change is not triggered correctly
export function MantineSelect<T extends FieldValues>({
   name,
   control,
   defaultValue,
   rules,
   shouldUnregister,
   onChange,
   ...props
}: MantineSelectProps<T>) {
   const {
      field: { value, onChange: fieldOnChange, ...field },
      fieldState
   } = useController<T>({
      name,
      control,
      defaultValue,
      rules,
      shouldUnregister
   });

   return (
      <Select
         value={value}
         onChange={async (e) => {
            //console.log("change1", name, field.name, e);
            await fieldOnChange({
               ...new Event("change", { bubbles: true, cancelable: true }),
               target: {
                  value: e,
                  name: field.name
               }
            });
            // @ts-ignore
            onChange?.(e);
         }}
         error={fieldState.error?.message}
         {...field}
         {...props}
      />
   );
}
