import { useDisclosure } from "@mantine/hooks";
import { forwardRef, useImperativeHandle } from "react";
import { useState } from "react";
import { TbVariable, TbX } from "react-icons/tb";
import { IconButton } from "../../../components/buttons/IconButton";
import { JsonViewer } from "../../../components/code/JsonViewer";
import { Modal } from "../../../components/overlay/Modal";

export type SettingsSchemaModalRef = {
   open: () => void;
   close: () => void;
   isOpen: boolean;
};

type SettingSchemaModalProps = {
   tabs: { title: string; json: object }[];
   title?: string;
};

export const SettingSchemaModal = forwardRef<SettingsSchemaModalRef, SettingSchemaModalProps>(
   ({ tabs, title }, ref) => {
      const [opened, { open, close }] = useDisclosure(false);
      const [index, setIndex] = useState(0);
      const tab = tabs[index];

      useImperativeHandle(ref, () => ({
         open,
         close,
         isOpen: opened,
      }));

      if (!tab) return null;

      return (
         <Modal
            open={opened}
            onClose={close}
            className="min-w-96 w-9/12 mt-[80px] mb-[20px]"
            stickToTop
         >
            <div
               className="border border-primary rounded-lg flex flex-col overflow-scroll font-normal"
               style={{ maxHeight: "calc(100dvh - 100px)" }}
            >
               {title && (
                  <div className="bg-primary py-2 px-4 text-background font-mono flex flex-row gap-2 items-center">
                     <TbVariable size={20} className="opacity-50" />
                     {title}
                  </div>
               )}
               <div className="flex flex-row justify-between sticky top-0 bg-background z-10 py-4 px-5">
                  <div className="flex flex-row gap-3">
                     {tabs.map((t, key) => (
                        <button
                           key={key}
                           onClick={() => setIndex(key)}
                           data-active={key === index ? 1 : undefined}
                           className="font-mono data-[active]:font-bold"
                        >
                           {t.title}
                        </button>
                     ))}
                  </div>
                  <IconButton Icon={TbX} onClick={close} />
               </div>
               <div className="">
                  <JsonViewer json={tab.json} expand={6} showSize showCopy />
               </div>
            </div>
         </Modal>
      );
   },
);
