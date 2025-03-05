import { type PanelPosition, Panel as XYPanel } from "@xyflow/react";
import { type ComponentPropsWithoutRef, type HTMLAttributes, forwardRef } from "react";
import { twMerge } from "tailwind-merge";
import { IconButton as _IconButton } from "ui/components/buttons/IconButton";

export type PanelProps = HTMLAttributes<HTMLDivElement> & {
   position: PanelPosition;
   unstyled?: boolean;
};

export function Panel({ position, className, children, unstyled, ...props }: PanelProps) {
   if (unstyled) {
      return (
         <XYPanel
            position={position}
            className={twMerge("flex flex-row p-1 gap-4", className)}
            {...props}
         >
            {children}
         </XYPanel>
      );
   }

   return (
      <XYPanel position={position} {...props}>
         <Wrapper className={className}>{children}</Wrapper>
      </XYPanel>
   );
}

const Wrapper = ({ children, className, ...props }: ComponentPropsWithoutRef<"div">) => (
   <div
      {...props}
      className={twMerge(
         "flex flex-row bg-lightest border ring-2 ring-muted/5 border-muted rounded-full items-center p-1",
         className,
      )}
   >
      {children}
   </div>
);

const IconButton = ({
   Icon,
   size = "lg",
   variant = "ghost",
   onClick,
   disabled,
   className,
   round,
   ...rest
}: ComponentPropsWithoutRef<typeof _IconButton> & { round?: boolean }) => (
   <_IconButton
      Icon={Icon}
      size={size}
      variant={variant}
      onClick={onClick}
      disabled={disabled}
      className={twMerge(round ? "rounded-full" : "", className)}
      {...rest}
   />
);

const Text = forwardRef<any, ComponentPropsWithoutRef<"span"> & { mono?: boolean }>(
   ({ children, className, mono, ...props }, ref) => (
      <span
         {...props}
         ref={ref}
         className={twMerge("text-md font-medium leading-none", mono && "font-mono", className)}
      >
         {children}
      </span>
   ),
);

Panel.Wrapper = Wrapper;
Panel.IconButton = IconButton;
Panel.Text = Text;
