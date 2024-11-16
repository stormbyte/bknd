import { useRef, useState } from "react";
import { Button } from "ui";
import {
   JsonSchemaForm,
   type JsonSchemaFormProps,
   type JsonSchemaFormRef
} from "ui/components/form/json-schema/JsonSchemaForm";

import type { ContextModalProps } from "@mantine/modals";

type Props = JsonSchemaFormProps & {
   onSubmit?: (data: any) => void | Promise<void>;
};

export function SchemaFormModal({
   context,
   id,
   innerProps: { schema, uiSchema, onSubmit }
}: ContextModalProps<Props>) {
   const [valid, setValid] = useState(false);
   const formRef = useRef<JsonSchemaFormRef>(null);

   function handleChange(data) {
      const valid = formRef.current?.validateForm() ?? false;
      console.log("Data changed", data, valid);
      setValid(valid);
   }

   function handleClose() {
      context.closeModal(id);
   }

   async function handleClickAdd() {
      await onSubmit?.(formRef.current?.formData());
      handleClose();
   }

   return (
      <div className="pt-3 pb-3 px-3 gap-4 flex flex-col">
         <JsonSchemaForm
            tagName="form"
            ref={formRef}
            schema={schema}
            uiSchema={uiSchema}
            className="legacy hide-required-mark fieldset-alternative mute-root"
            onChange={handleChange}
            onSubmit={handleClickAdd}
         />
         <div className="flex flex-row justify-end gap-2">
            <Button onClick={handleClose}>Cancel</Button>
            <Button variant="primary" onClick={handleClickAdd} disabled={!valid}>
               Create
            </Button>
         </div>
      </div>
   );
}

SchemaFormModal.defaultTitle = "JSON Schema Form Modal";
SchemaFormModal.modalProps = {
   classNames: {
      size: "md",
      root: "bknd-admin",
      header: "!bg-primary/5 border-b border-b-muted !py-3 px-5 !h-auto !min-h-px",
      content: "rounded-lg select-none",
      title: "font-bold !text-md",
      body: "!p-0"
   }
};
