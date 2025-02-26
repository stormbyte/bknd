import { useClickOutside } from "@mantine/hooks";
import { type ReactElement, cloneElement, useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

export type ModalProps = {
   open?: boolean;
   stickToTop?: boolean;
   className?: string;
   onClose?: () => void;
   allowBackdropClose?: boolean;
   children: ReactElement<{ onClick: () => void }>;
};

export function Modal({
   open = false,
   children,
   onClose = () => null,
   allowBackdropClose = true,
   className,
   stickToTop,
}: ModalProps) {
   const clickoutsideRef = useClickOutside(() => {
      if (allowBackdropClose) onClose();
   });

   return (
      <>
         {open && (
            <div
               className={twMerge(
                  "w-full h-full fixed bottom-0 top-0 right-0 left-0 bg-background/60 flex justify-center backdrop-blur-sm z-10",
                  stickToTop ? "items-start" : "items-center",
               )}
            >
               <div
                  className={twMerge(
                     "z-20 flex flex-col bg-background rounded-lg shadow-lg",
                     className,
                  )}
                  ref={clickoutsideRef}
               >
                  {children}
               </div>
            </div>
         )}
      </>
   );
}
