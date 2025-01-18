import type { ContextModalProps } from "@mantine/modals";
import type { ReactNode } from "react";

export function OverlayModal({
   context,
   id,
   innerProps: { content }
}: ContextModalProps<{ content?: ReactNode }>) {
   return content;
}

OverlayModal.defaultTitle = undefined;
OverlayModal.modalProps = {
   withCloseButton: false,
   classNames: {
      size: "md",
      root: "bknd-admin",
      content: "text-center justify-center",
      title: "font-bold !text-md",
      body: "py-3 px-5 gap-4 flex flex-col"
   }
};
