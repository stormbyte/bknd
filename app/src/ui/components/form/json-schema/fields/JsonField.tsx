import type { FieldProps } from "@rjsf/utils";
import { JsonEditor } from "../../../code/JsonEditor";
import { Label } from "../templates/FieldTemplate";

// @todo: move editor to lazy loading component
export default function JsonField({
   formData,
   onChange,
   disabled,
   readonly,
   ...props
}: FieldProps) {
   const value = JSON.stringify(formData, null, 2);

   function handleChange(data) {
      try {
         onChange(JSON.parse(data));
      } catch (err) {
         console.error(err);
      }
   }

   const isDisabled = disabled || readonly;
   const id = props.idSchema.$id;

   return (
      <div className="flex flex-col gap-2">
         <Label label={props.name} id={id} />
         <JsonEditor value={value} editable={!isDisabled} onChange={handleChange} />
      </div>
   );
}
