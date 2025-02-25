import { Modal, type ModalProps, Popover } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconBug } from "@tabler/icons-react";
import { ScrollArea } from "radix-ui";
import { Fragment, forwardRef, useImperativeHandle } from "react";
import { TbX } from "react-icons/tb";
import { twMerge } from "tailwind-merge";
import { Button } from "../buttons/Button";
import { IconButton } from "../buttons/IconButton";
import { JsonViewer } from "../code/JsonViewer";

export type Modal2Ref = {
   open: () => void;
   close: () => void;
};
export type Modal2Props = Omit<ModalProps, "opened" | "onClose"> & {
   opened?: boolean;
   onClose?: () => void;
};

export const Modal2 = forwardRef<Modal2Ref, Modal2Props>(
   (
      { classNames, children, opened: initialOpened, closeOnClickOutside = false, ...props },
      ref
   ) => {
      const [opened, { open, close }] = useDisclosure(initialOpened);

      useImperativeHandle(ref, () => ({
         open,
         close
      }));

      return (
         <Modal
            withCloseButton={false}
            padding={0}
            size="xl"
            opened={opened}
            {...props}
            closeOnClickOutside={closeOnClickOutside}
            onClose={close}
            classNames={{
               ...classNames,
               root: "bknd-admin",
               content: "rounded-lg select-none"
            }}
         >
            {children}
         </Modal>
      );
   }
);

export const ModalTitle = ({ path, onClose }: { path: string[]; onClose: () => void }) => {
   return (
      <div className="py-3 px-5 font-bold bg-lightest flex flex-row justify-between items-center sticky top-0 left-0 right-0 z-10 border-none">
         <div className="flex flex-row gap-1">
            {path.map((p, i) => {
               const last = i + 1 === path.length;
               return (
                  <Fragment key={i}>
                     <span key={i} className={twMerge("", !last && "opacity-70")}>
                        {p}
                     </span>
                     {!last && <span className="opacity-40">/</span>}
                  </Fragment>
               );
            })}
         </div>
         <IconButton Icon={TbX} onClick={onClose} />
      </div>
   );
};

export const ModalBody = ({ children, className }: { children?: any; className?: string }) => (
   <ScrollArea.Root
      className={twMerge("flex flex-col min-h-96", className)}
      style={{
         maxHeight: "calc(80vh)"
      }}
   >
      <ScrollArea.Viewport className="w-full h-full">
         <div className="py-3 px-5 gap-4 flex flex-col">{children}</div>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar
         forceMount
         className="flex select-none touch-none bg-transparent w-0.5"
         orientation="vertical"
      >
         <ScrollArea.Thumb className="flex-1 bg-primary/50" />
      </ScrollArea.Scrollbar>
      <ScrollArea.Scrollbar
         forceMount
         className="flex select-none touch-none bg-muted flex-col h-0.5"
         orientation="horizontal"
      >
         <ScrollArea.Thumb className="flex-1 bg-primary/50 " />
      </ScrollArea.Scrollbar>
   </ScrollArea.Root>
);

export const ModalFooter = ({
   next,
   prev,
   nextLabel = "Next",
   prevLabel = "Back",
   debug
}: {
   next: any;
   prev: any;
   nextLabel?: string;
   prevLabel?: string;
   debug?: any;
}) => {
   const [opened, handlers] = useDisclosure(false);
   return (
      <div className="flex flex-col border-t border-t-muted">
         <div className="flex flex-row justify-between items-center py-3 px-4">
            <div>
               {debug && (
                  <Popover
                     position="right-start"
                     shadow="md"
                     opened={opened}
                     classNames={{
                        dropdown: "!px-1 !pr-2.5 !py-2 text-sm"
                     }}
                  >
                     <Popover.Target>
                        <IconButton
                           onClick={handlers.toggle}
                           Icon={IconBug}
                           variant={opened ? "default" : "ghost"}
                        />
                     </Popover.Target>
                     <Popover.Dropdown>
                        <JsonViewer json={debug} expand={6} className="p-0" />
                     </Popover.Dropdown>
                  </Popover>
               )}
            </div>

            <div className="flex flex-row gap-2">
               <Button className="w-24 justify-center" {...prev}>
                  {prevLabel}
               </Button>
               <Button className="w-24 justify-center" variant="primary" {...next}>
                  {nextLabel}
               </Button>
            </div>
         </div>
      </div>
   );
};
