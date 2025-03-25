import type { ComponentProps } from "react";

export function Center(props: ComponentProps<"div">) {
   return (
      <div
         {...props}
         className={"w-full min-h-full flex justify-center items-center " + props.className}
      />
   );
}
