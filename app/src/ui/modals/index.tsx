import type { ModalProps } from "@mantine/core";
import { modals as $modals, ModalsProvider, closeModal, openContextModal } from "@mantine/modals";
import { transformObject } from "core/utils";
import type { ComponentProps } from "react";
import { OverlayModal } from "ui/modals/debug/OverlayModal";
import { DebugModal } from "./debug/DebugModal";
import { SchemaFormModal } from "./debug/SchemaFormModal";
import { TestModal } from "./debug/TestModal";

const modals = {
   test: TestModal,
   debug: DebugModal,
   form: SchemaFormModal,
   overlay: OverlayModal
};

declare module "@mantine/modals" {
   export interface MantineModalsOverride {
      modals: typeof modals;
   }
}

export function BkndModalsProvider({ children }) {
   return (
      <ModalsProvider modals={modals} modalProps={{ className: "bknd-admin" }}>
         {children}
      </ModalsProvider>
   );
}

function open<Modal extends keyof typeof modals>(
   modal: Modal,
   innerProps: ComponentProps<(typeof modals)[Modal]>["innerProps"],
   { title: _title, ...modalProps }: Partial<ModalProps> = {}
) {
   const title = _title ?? modals[modal].defaultTitle ?? undefined;
   const cmpModalProps = modals[modal].modalProps ?? {};
   const props = {
      title,
      ...modalProps,
      ...cmpModalProps,
      modal,
      innerProps
   };
   openContextModal(props);
   return {
      close: () => close(modal),
      closeAll: $modals.closeAll
   };
}

function close<Modal extends keyof typeof modals>(modal: Modal) {
   return closeModal(modal);
}

export const bkndModals = {
   ids: transformObject(modals, (key) => key) as unknown as Record<
      keyof typeof modals,
      keyof typeof modals
   >,
   open,
   close,
   closeAll: $modals.closeAll
};
