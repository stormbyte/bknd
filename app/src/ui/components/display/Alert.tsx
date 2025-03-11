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
      <div
         {...props}
         className={twMerge(
            "flex flex-row items-center dark:bg-amber-300/20 bg-amber-200 p-4",
            className,
         )}
      >
         <p>
            {title && <b>{title}: </b>}
            {message || children}
         </p>
      </div>
   ) : null;

const Warning: React.FC<AlertProps> = ({ className, ...props }) => (
   <Base {...props} className={twMerge("dark:bg-amber-300/20 bg-amber-200", className)} />
);

const Exception: React.FC<AlertProps> = ({ className, ...props }) => (
   <Base {...props} className={twMerge("dark:bg-red-950 bg-red-100", className)} />
);

const Success: React.FC<AlertProps> = ({ className, ...props }) => (
   <Base {...props} className={twMerge("dark:bg-green-950 bg-green-100", className)} />
);

const Info: React.FC<AlertProps> = ({ className, ...props }) => (
   <Base {...props} className={twMerge("dark:bg-blue-950 bg-blue-100", className)} />
);

export const Alert = {
   Warning,
   Exception,
   Success,
   Info,
};
