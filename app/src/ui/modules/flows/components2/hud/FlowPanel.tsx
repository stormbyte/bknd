import type { ElementProps } from "@mantine/core";
import { Panel, type PanelPosition } from "@xyflow/react";
import { type HTMLAttributes, forwardRef } from "react";
import { twMerge } from "tailwind-merge";
import { IconButton as _IconButton } from "ui/components/buttons/IconButton";

export type FlowPanel = HTMLAttributes<HTMLDivElement> & {
   position: PanelPosition;
   unstyled?: boolean;
};

export function FlowPanel({ position, className, children, unstyled, ...props }: FlowPanel) {
   if (unstyled) {
      return (
         <Panel
            position={position}
            className={twMerge("flex flex-row p-1 gap-4", className)}
            {...props}
         >
            {children}
         </Panel>
      );
   }

   return (
      <Panel position={position} {...props}>
         <Wrapper className={className}>{children}</Wrapper>
      </Panel>
   );
}

const Wrapper = ({ children, className, ...props }: ElementProps<"div">) => (
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
}: ElementProps<typeof _IconButton> & { round?: boolean }) => (
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

const Text = forwardRef<any, ElementProps<"span"> & { mono?: boolean }>(
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

FlowPanel.Wrapper = Wrapper;
FlowPanel.IconButton = IconButton;
FlowPanel.Text = Text;
