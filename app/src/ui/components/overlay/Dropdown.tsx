import { useClickOutside } from "@mantine/hooks";
import {
   type ComponentPropsWithoutRef,
   Fragment,
   type ReactElement,
   cloneElement,
   useState
} from "react";
import { twMerge } from "tailwind-merge";
import { useEvent } from "../../hooks/use-event";

export type DropdownItem =
   | (() => JSX.Element)
   | {
        label: string | ReactElement;
        icon?: any;
        onClick?: () => void;
        destructive?: boolean;
        disabled?: boolean;
        [key: string]: any;
     };

export type DropdownClickableChild = ReactElement<{ onClick: () => void }>;
export type DropdownProps = {
   className?: string;
   openEvent?: "onClick" | "onContextMenu";
   defaultOpen?: boolean;
   title?: string | ReactElement;
   dropdownWrapperProps?: Omit<ComponentPropsWithoutRef<"div">, "style">;
   position?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
   hideOnEmpty?: boolean;
   items: (DropdownItem | undefined | boolean)[];
   itemsClassName?: string;
   children: DropdownClickableChild;
   onClickItem?: (item: DropdownItem) => void;
   renderItem?: (
      item: DropdownItem,
      props: { key: number; onClick: () => void }
   ) => DropdownClickableChild;
};

export function Dropdown({
   children,
   defaultOpen = false,
   openEvent = "onClick",
   position = "bottom-start",
   dropdownWrapperProps,
   items,
   title,
   hideOnEmpty = true,
   onClickItem,
   renderItem,
   itemsClassName,
   className
}: DropdownProps) {
   const [open, setOpen] = useState(defaultOpen);
   const clickoutsideRef = useClickOutside(() => setOpen(false));
   const menuItems = items.filter(Boolean) as DropdownItem[];

   const toggle = useEvent((delay: number = 50) =>
      setTimeout(() => setOpen((prev) => !prev), typeof delay === "number" ? delay : 0)
   );

   const openEventHandler = useEvent((e) => {
      e.preventDefault();
      toggle();
   });

   const offset = 4;
   const dropdownStyle = {
      "bottom-start": { top: "100%", left: 0, marginTop: offset },
      "bottom-end": { right: 0, top: "100%", marginTop: offset },
      "top-start": { bottom: "100%", marginBottom: offset },
      "top-end": { bottom: "100%", right: 0, marginBottom: offset }
   }[position];

   const internalOnClickItem = useEvent((item) => {
      if (item.onClick) item.onClick();
      if (onClickItem) onClickItem(item);
      toggle(50);
   });

   if (menuItems.length === 0 && hideOnEmpty) return null;
   const space_for_icon = menuItems.some((item) => "icon" in item && item.icon);

   const itemRenderer =
      renderItem ||
      ((item, { key, onClick }) =>
         typeof item === "function" ? (
            <Fragment key={key}>{item()}</Fragment>
         ) : (
            <button
               type="button"
               key={key}
               disabled={item.disabled}
               className={twMerge(
                  "flex flex-row flex-nowrap text-nowrap items-center outline-none cursor-pointer px-2.5 rounded-md link leading-none h-8",
                  itemsClassName,
                  item.disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/10",
                  item.destructive && "text-red-500 hover:bg-red-600 hover:text-white"
               )}
               onClick={onClick}
            >
               {space_for_icon && (
                  <div className="size-[16px] text-left mr-1.5 opacity-80">
                     {item.icon && <item.icon className="size-[16px]" />}
                  </div>
               )}
               {/*{item.icon && <item.icon className="size-4" />}*/}
               <div className="flex flex-grow truncate text-nowrap">{item.label}</div>
            </button>
         ));

   return (
      <div
         role="dropdown"
         className={twMerge("relative flex", className)}
         ref={clickoutsideRef}
         onContextMenu={openEvent === "onContextMenu" ? openEventHandler : undefined}
      >
         {cloneElement(
            children as any,
            openEvent === "onClick" ? { onClick: openEventHandler } : {}
         )}
         {open && (
            <div
               {...dropdownWrapperProps}
               className={twMerge(
                  "absolute z-30 flex flex-col bg-background border border-muted px-1 py-1 rounded-lg shadow-lg min-w-full",
                  dropdownWrapperProps?.className
               )}
               style={dropdownStyle}
            >
               {title && <div className="text-sm font-bold px-3 mb-1 mt-1 opacity-50">{title}</div>}
               {menuItems.map((item, i) =>
                  itemRenderer(item, { key: i, onClick: () => internalOnClickItem(item) })
               )}
            </div>
         )}
      </div>
   );
}
