import type { ContextModalProps } from "@mantine/modals";

export function TestModal({ context, id, innerProps }: ContextModalProps<{ modalBody: string }>) {
   return (
      <>
         <span>{innerProps.modalBody}</span>
         <button onClick={() => context.closeModal(id)}>Close modal</button>
      </>
   );
}

TestModal.defaultTitle = "Test Modal";
TestModal.modalProps = {
   classNames: {
      size: "md",
      root: "bknd-admin",
      header: "!bg-primary/5 border-b border-b-muted !py-3 px-5 !h-auto !min-h-px",
      content: "rounded-lg select-none",
      title: "font-bold !text-md",
      body: "py-3 px-5 gap-4 flex flex-col",
   },
};
