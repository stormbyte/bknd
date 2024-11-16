import { Modal, TextInput } from "@mantine/core";
import { useDisclosure, useFocusTrap } from "@mantine/hooks";
import { StringIdentifier, transformObject, ucFirstAllSnakeToPascalWithSpaces } from "core/utils";
import { useRef } from "react";
import { useBkndAuth } from "ui/client/schema/auth/use-bknd-auth";
import { JsonSchemaForm } from "ui/components/form/json-schema/JsonSchemaForm";
import { bkndModals } from "ui/modals";
import { SchemaFormModal } from "ui/modals/debug/SchemaFormModal";
import { useBknd } from "../../client/BkndProvider";
import { Button } from "../../components/buttons/Button";
import { CellValue, DataTable } from "../../components/table/DataTable";
import * as AppShell from "../../layouts/AppShell/AppShell";
import { routes, useNavigate } from "../../lib/routes";

export function AuthRolesList() {
   const [navigate] = useNavigate();
   const [modalOpen, modalHandler] = useDisclosure(false);
   const focusRef = useFocusTrap();
   const inputRef = useRef<HTMLInputElement>(null);
   const { config, actions } = useBkndAuth();

   const data = Object.values(
      transformObject(config.roles ?? {}, (role, name) => ({
         role: name,
         permissions: role.permissions,
         is_default: role.is_default ?? false,
         implicit_allow: role.implicit_allow ?? false
      }))
   );

   function handleClick(row) {
      navigate(routes.auth.roles.edit(row.role));
   }

   function openCreateModal() {
      bkndModals.open(
         "form",
         {
            schema: {
               type: "object",
               properties: {
                  name: StringIdentifier
               },
               required: ["name"]
            },
            uiSchema: {
               name: {
                  "ui:title": "Role name"
               }
            },
            onSubmit: async (data) => {
               if (data.name.length > 0) {
                  if (await actions.roles.add(data.name)) {
                     navigate(routes.auth.roles.edit(data.name));
                  }
               }
            }
         },
         {
            title: "New Role"
         }
      );
   }

   return (
      <>
         {/*<Modal
            ref={focusRef}
            opened={modalOpen}
            onClose={modalHandler.close}
            title={"New Role"}
            classNames={{
               root: "bknd-admin",
               header: "!bg-primary/5 border-b border-b-muted !py-3 px-5 !h-auto !min-h-px",
               content: "rounded-lg select-none",
               title: "font-bold !text-md",
               body: "pt-3 pb-3 px-3 gap-4 flex flex-col"
            }}
         >
            <TextInput ref={inputRef} data-autofocus size="md" placeholder="Enter role name" />
            <div className="flex flex-row justify-end gap-2">
               <Button onClick={() => modalHandler.close()}>Cancel</Button>
               <Button variant="primary" onClick={handleClickAdd}>
                  Create
               </Button>
            </div>
         </Modal>*/}
         <AppShell.SectionHeader
            right={
               <Button variant="primary" onClick={openCreateModal}>
                  Create new
               </Button>
            }
         >
            Roles & Permissions
         </AppShell.SectionHeader>
         <AppShell.Scrollable>
            <div className="flex flex-col flex-grow p-3 gap-3">
               <DataTable
                  data={data}
                  renderValue={renderValue}
                  renderHeader={ucFirstAllSnakeToPascalWithSpaces}
                  onClickRow={handleClick}
               />
            </div>
         </AppShell.Scrollable>
      </>
   );
}

const renderValue = ({ value, property }) => {
   if (["is_default", "implicit_allow"].includes(property)) {
      return value ? <span>Yes</span> : <span className="opacity-50">No</span>;
   }

   if (property === "permissions") {
      return [...(value || [])].map((p, i) => (
         <span
            key={i}
            className="inline-block px-2 py-1.5 text-sm bg-primary/5 rounded font-mono leading-none"
         >
            {p}
         </span>
      ));
   }

   return <CellValue value={value} property={property} />;
};
