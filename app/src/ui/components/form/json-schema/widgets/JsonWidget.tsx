import type { WidgetProps } from "@rjsf/utils";
import { useState } from "react";

export default function JsonWidget({ value, onChange, disabled, readonly, ...props }: WidgetProps) {
   const [val, setVal] = useState(JSON.stringify(value, null, 2));

   function handleChange(e) {
      setVal(e.target.value);
      try {
         onChange(JSON.parse(e.target.value));
      } catch (err) {
         console.error(err);
      }
   }

   return (
      <textarea value={val} rows={10} disabled={disabled || readonly} onChange={handleChange} />
   );
}
