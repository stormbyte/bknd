import type { ModalProps } from "@mantine/core";
import { ModalsProvider, modals as mantineModals } from "@mantine/modals";
import { transformObject } from "core/utils";
import type { ComponentProps } from "react";
import { DebugModal } from "./debug/DebugModal";
import { SchemaFormModal } from "./debug/SchemaFormModal";
import { TestModal } from "./debug/TestModal";

const modals = {
   test: TestModal,
   debug: DebugModal,
   form: SchemaFormModal
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
   return mantineModals.openContextModal({
      title,
      ...modalProps,
      ...cmpModalProps,
      modal,
      innerProps
   });
}

function close<Modal extends keyof typeof modals>(modal: Modal) {
   return mantineModals.close(modal);
}

export const bkndModals = {
   ids: transformObject(modals, (key) => key) as unknown as Record<
      keyof typeof modals,
      keyof typeof modals
   >,
   open,
   close,
   closeAll: mantineModals.closeAll
};
