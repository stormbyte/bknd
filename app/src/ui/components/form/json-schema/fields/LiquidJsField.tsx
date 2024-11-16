import type { FieldProps } from "@rjsf/utils";
import { LiquidJsEditor } from "../../../code/LiquidJsEditor";
import { Label } from "../templates/FieldTemplate";

// @todo: move editor to lazy loading component
export default function LiquidJsField({
   formData,
   onChange,
   disabled,
   readonly,
   ...props
}: FieldProps) {
   function handleChange(data) {
      onChange(data);
   }

   const isDisabled = disabled || readonly;
   const id = props.idSchema.$id;

   return (
      <div className="flex flex-col gap-2">
         <Label label={props.name} id={id} />
         <LiquidJsEditor value={formData} editable={!isDisabled} onChange={handleChange} />
      </div>
   );
}
