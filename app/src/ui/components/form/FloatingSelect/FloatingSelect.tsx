import { FloatingIndicator, Input, UnstyledButton } from "@mantine/core";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

export type FloatingSelectProps = {
   data: string[];
   description?: string;
   label?: string;
};

export function FloatingSelect({ data, label, description }: FloatingSelectProps) {
   const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null);
   const [controlsRefs, setControlsRefs] = useState<Record<string, HTMLButtonElement | null>>({});
   const [active, setActive] = useState(0);

   const setControlRef = (index: number) => (node: HTMLButtonElement) => {
      controlsRefs[index] = node;
      setControlsRefs(controlsRefs);
   };

   const controls = data.map((item, index) => (
      <button
         key={item}
         className={twMerge(
            "transition-colors duration-100 px-2.5 py-2 leading-none rounded-lg text-md",
            active === index && "text-white"
         )}
         ref={setControlRef(index)}
         onClick={() => setActive(index)}
      >
         <span className="relative z-[1]">{item}</span>
      </button>
   ));

   return (
      <Input.Wrapper className="flex flex-col gap-1">
         {label && (
            <div className="flex flex-col">
               <Input.Label>{label}</Input.Label>
               {description && <Input.Description>{description}</Input.Description>}
            </div>
         )}
         <div className="relative w-fit bg-primary/5 px-1.5 py-1 rounded-lg" ref={setRootRef}>
            {controls}

            <FloatingIndicator
               target={controlsRefs[active]}
               parent={rootRef}
               className="bg-primary rounded-lg"
            />
         </div>
         {/*<Input.Error>Input error</Input.Error>*/}
      </Input.Wrapper>
   );
}
