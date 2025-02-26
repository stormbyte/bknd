import { ucFirstAllSnakeToPascalWithSpaces } from "core/utils";
import { useRef } from "react";
import { TbTrash } from "react-icons/tb";
import { useFlows } from "../../client/schema/flows/use-flows";
import { Button } from "../../components/buttons/Button";
import { CellValue, DataTable } from "../../components/table/DataTable";
import * as AppShell from "../../layouts/AppShell/AppShell";
import { routes, useNavigate } from "../../lib/routes";
import { FlowCreateModal, type TCreateFlowModalSchema } from "./components/FlowCreateModal";

export function FlowsList() {
   const createModalRef = useRef<TCreateFlowModalSchema>(null);
   const [navigate] = useNavigate();
   const { flows } = useFlows();
   console.log("flows", flows);

   const data = flows.map((flow) => ({
      flow: flow.name,
      trigger: flow.trigger.type,
      mode: flow.trigger.config.mode,
      tasks: Object.keys(flow.tasks).length,
      start_task: flow.startTask?.name,
   }));

   function handleClick(row) {
      navigate(routes.flows.flows.edit(row.flow));
   }

   return (
      <>
         <FlowCreateModal ref={createModalRef} />
         <AppShell.SectionHeader
            right={
               <Button variant="primary" onClick={() => createModalRef.current?.open()}>
                  Create new
               </Button>
            }
         >
            All Flows
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
