import { useClickOutside } from "@mantine/hooks";
import { type ComponentPropsWithoutRef, type ReactElement, cloneElement, useState } from "react";
import { twMerge } from "tailwind-merge";
import { useEvent } from "ui/hooks/use-event";

export type PopoverProps = {
   className?: string;
   defaultOpen?: boolean;
   position?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
   backdrop?: boolean;
   target: (props: { toggle: () => void }) => ReactElement;
   children: ReactElement<{ onClick: () => void }>;
   overlayProps?: ComponentPropsWithoutRef<"div">;
};

export function Popover({
   children,
   target,
   defaultOpen = false,
   backdrop = false,
   position = "bottom-start",
   overlayProps,
   className
}: PopoverProps) {
   const [open, setOpen] = useState(defaultOpen);
   const clickoutsideRef = useClickOutside(() => setOpen(false));

   const toggle = useEvent((delay: number = 50) =>
      setTimeout(() => setOpen((prev) => !prev), typeof delay === "number" ? delay : 0)
   );

   const pos = {
      "bottom-start": "mt-1 top-[100%]",
      "bottom-end": "right-0 top-[100%] mt-1",
      "top-start": "bottom-[100%] mb-1",
      "top-end": "bottom-[100%] right-0 mb-1"
   }[position];

   return (
      <>
         {open && backdrop && (
            <div className="animate-fade-in w-full h-full absolute top-0 bottom-0 right-0 left-0 bg-background/60" />
         )}
         <div role="dropdown" className={twMerge("relative flex", className)} ref={clickoutsideRef}>
            {cloneElement(children as any, { onClick: toggle })}
            {open && (
               <div
                  {...overlayProps}
                  className={twMerge(
                     "animate-fade-in absolute z-20 flex flex-col bg-background border border-muted px-1 py-1 rounded-lg shadow-lg backdrop-blur-sm min-w-full max-w-20",
                     pos,
                     overlayProps?.className
                  )}
               >
                  {target({ toggle })}
               </div>
            )}
         </div>
      </>
   );
}
