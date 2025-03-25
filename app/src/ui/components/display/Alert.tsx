import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export type AlertProps = ComponentPropsWithoutRef<"div"> & {
   className?: string;
   visible?: boolean;
   title?: string;
   message?: ReactNode | string;
   children?: ReactNode;
};

const Base: React.FC<AlertProps> = ({
   visible = true,
   title,
   message,
   className,
   children,
   ...props
}) =>
   visible ? (
      <div {...props} className={twMerge("flex flex-row items-center p-4", className)}>
         <p>
            {title && <b>{title}: </b>}
            {message || children}
         </p>
      </div>
   ) : null;

const Warning: React.FC<AlertProps> = ({ className, ...props }) => (
   <Base {...props} className={twMerge("bg-warning text-warning-foreground", className)} />
);

const Exception: React.FC<AlertProps> = ({ className, ...props }) => (
   <Base {...props} className={twMerge("bg-error text-error-foreground", className)} />
);

const Success: React.FC<AlertProps> = ({ className, ...props }) => (
   <Base {...props} className={twMerge("bg-success text-success-foreground", className)} />
);

const Info: React.FC<AlertProps> = ({ className, ...props }) => (
   <Base {...props} className={twMerge("bg-info text-info-foreground", className)} />
);

export const Alert = {
   Warning,
   Exception,
   Success,
   Info,
};
