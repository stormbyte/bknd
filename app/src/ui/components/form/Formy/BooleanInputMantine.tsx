import { Switch } from "@mantine/core";
import { forwardRef, useEffect, useState } from "react";

export const BooleanInputMantine = forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
   (props, ref) => {
      const [checked, setChecked] = useState(Boolean(props.value ?? props.defaultValue));

      useEffect(() => {
         console.log("value change", props.value);
         setChecked(Boolean(props.value));
      }, [props.value]);

      function handleCheck(e) {
         setChecked(e.target.checked);
         props.onChange?.(e.target.checked);
      }

      return (
         <div className="flex flex-row">
            <Switch
               ref={ref}
               checked={checked}
               onChange={handleCheck}
               disabled={props.disabled}
               id={props.id}
            />
         </div>
      );
   },
);
