import { type ModalProps, Tabs } from "@mantine/core";
import type { ContextModalProps } from "@mantine/modals";
import clsx from "clsx";
import { transformObject } from "core/utils";
import type { ComponentProps } from "react";
import { JsonViewer } from "../../components/code/JsonViewer";

type JsonViewerProps = Omit<ComponentProps<typeof JsonViewer>, "title" | "json">;
type Primitive = object | string | number | boolean | any[];
type DebugProps = {
   data: {
      [key: string]: ({ label: string; value: Primitive } & JsonViewerProps) | Primitive;
   };
} & JsonViewerProps;

export function DebugModal({ innerProps }: ContextModalProps<DebugProps>) {
   const { data, ...jsonViewerProps } = innerProps;
   const tabs = transformObject(data, (item, name) => {
      if (typeof item === "object" && "label" in item) {
         return item;
      }

      return {
         label: <span className="font-mono">{name}</span>,
         value: item,
         expand: 10,
         showCopy: true,
         ...jsonViewerProps,
      };
   });

   const count = Object.keys(tabs).length;
   function renderTab({ value, label, className, ...props }: (typeof tabs)[keyof typeof tabs]) {
      return <JsonViewer json={value as any} className={clsx("text-sm", className)} {...props} />;
   }

   return (
      <div className="bg-background">
         {count > 1 ? (
            <Tabs defaultValue={Object.keys(tabs)[0]}>
               <div className="sticky top-0 bg-background z-10">
                  <Tabs.List>
                     {Object.entries(tabs).map(([key, tab]) => (
                        <Tabs.Tab key={key} value={key}>
                           {tab.label}
                        </Tabs.Tab>
                     ))}
                  </Tabs.List>
               </div>
               {Object.entries(tabs).map(([key, tab]) => (
                  <Tabs.Panel key={key} value={key}>
                     {renderTab(tab)}
                  </Tabs.Panel>
               ))}
            </Tabs>
         ) : (
            renderTab({
               // @ts-expect-error
               ...tabs[Object.keys(tabs)[0]],
               // @ts-expect-error
               title: tabs[Object.keys(tabs)[0]].label,
            })
         )}
      </div>
   );
}

DebugModal.defaultTitle = false;
DebugModal.modalProps = {
   withCloseButton: false,
   size: "lg",
   classNames: {
      body: "!p-0",
   },
} satisfies Omit<ModalProps, "opened" | "onClose">;
