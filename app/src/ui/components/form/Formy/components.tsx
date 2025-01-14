import { getBrowser } from "core/utils";
import type { Field } from "data";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { TbCalendar, TbChevronDown, TbInfoCircle } from "react-icons/tb";
import { twMerge } from "tailwind-merge";
import { IconButton } from "ui/components/buttons/IconButton";
import { useEvent } from "ui/hooks/use-event";

export const Group: React.FC<React.ComponentProps<"div"> & { error?: boolean }> = ({
   error,
   ...props
}) => (
   <div
      {...props}
      className={twMerge(
         "flex flex-col gap-1.5",

         error && "text-red-500",
         props.className
      )}
   />
);

export const formElementFactory = (element: string, props: any) => {
   switch (element) {
      case "date":
         return DateInput;
      case "boolean":
         return BooleanInput;
      case "textarea":
         return Textarea;
      default:
         return Input;
   }
};

export const Label: React.FC<React.ComponentProps<"label">> = (props) => <label {...props} />;

export const FieldLabel: React.FC<React.ComponentProps<"label"> & { field: Field }> = ({
   field,
   ...props
}) => {
   const desc = field.getDescription();
   return (
      <Label {...props} title={desc} className="flex flex-row gap-2 items-center">
         {field.getLabel()}
         {desc && <TbInfoCircle className="opacity-50" />}
      </Label>
   );
};

export const Input = forwardRef<HTMLInputElement, React.ComponentProps<"input">>((props, ref) => {
   const disabledOrReadonly = props.disabled || props.readOnly;
   return (
      <input
         type="text"
         {...props}
         ref={ref}
         className={twMerge(
            "bg-muted/40 h-11 rounded-md py-2.5 px-4 outline-none",
            disabledOrReadonly && "bg-muted/50 text-primary/50",
            !disabledOrReadonly &&
               "focus:bg-muted focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent transition-all",
            props.className
         )}
      />
   );
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
   (props, ref) => {
      return (
         <textarea
            rows={3}
            {...props}
            ref={ref}
            className={twMerge(
               "bg-muted/40 min-h-11 rounded-md py-2.5 px-4 focus:bg-muted outline-none focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent transition-all disabled:bg-muted/50 disabled:text-primary/50",
               props.className
            )}
         />
      );
   }
);

export const DateInput = forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
   (props, ref) => {
      const innerRef = useRef<HTMLInputElement>(null);
      const browser = getBrowser();
      useImperativeHandle(ref, () => innerRef.current!);

      const handleClick = useEvent(() => {
         if (innerRef?.current) {
            innerRef.current.focus();
            if (["Safari"].includes(browser)) {
               innerRef.current.click();
            } else {
               innerRef.current.showPicker();
            }
         }
      });

      return (
         <div className="relative w-full">
            <div className="absolute h-full right-3 top-0 bottom-0 flex items-center">
               <IconButton Icon={TbCalendar} onClick={handleClick} />
            </div>
            <Input
               {...props}
               type={props.type ?? "date"}
               ref={innerRef}
               className="w-full appearance-none"
            />
         </div>
      );
   }
);

export const BooleanInput = forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
   (props, ref) => {
      const [checked, setChecked] = useState(Boolean(props.value));

      useEffect(() => {
         setChecked(Boolean(props.value));
      }, [props.value]);

      function handleCheck(e) {
         setChecked(e.target.checked);
         props.onChange?.(e.target.checked);
      }

      return (
         <div className="h-11 flex items-center">
            <input
               {...props}
               type="checkbox"
               ref={ref}
               className="outline-none focus:outline-none focus:ring-2 focus:ring-zinc-500  transition-all disabled:opacity-70 scale-150 ml-1"
               checked={checked}
               onChange={handleCheck}
               disabled={props.disabled}
            />
         </div>
      );
   }
);

export const Select = forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
   (props, ref) => (
      <div className="flex w-full relative">
         <select
            {...props}
            ref={ref}
            className={twMerge(
               "bg-muted/40 focus:bg-muted rounded-md py-2.5 px-4 outline-none focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent transition-all disabled:bg-muted/50 disabled:text-primary/50",
               "appearance-none h-11 w-full",
               "border-r-8 border-r-transparent",
               props.className
            )}
         />
         <TbChevronDown className="absolute right-3 top-0 bottom-0 h-full opacity-70" size={18} />
      </div>
   )
);
