import { TbAlertCircle } from "react-icons/tb";
import { twMerge } from "tailwind-merge";

export type IconProps = {
   className?: string;
   title?: string;
};

const Warning = ({ className, ...props }: IconProps) => (
   <TbAlertCircle
      {...props}
      className={twMerge("dark:text-amber-300 text-amber-700 cursor-help", className)}
   />
);

export const Icon = {
   Warning,
};
