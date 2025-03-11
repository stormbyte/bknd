import { type Edge, type Node, useOnSelectionChange } from "@xyflow/react";
import { type Execution, ExecutionState, type Flow, type Task } from "flows";
import { useEffect, useState } from "react";
import {
   TbArrowLeft,
   TbChevronDown,
   TbChevronUp,
   TbDots,
   TbPlayerPlayFilled,
   TbSettings,
} from "react-icons/tb";
import { twMerge } from "tailwind-merge";
import FlowCanvas from "ui/modules/flows/components/FlowCanvas";
import { TaskForm } from "ui/modules/flows/components/form/TaskForm";
import { useLocation } from "wouter";
import { useBknd } from "../../client/BkndProvider";
import { Button } from "../../components/buttons/Button";
import { IconButton } from "../../components/buttons/IconButton";
import { Dropdown } from "../../components/overlay/Dropdown";
import { useFlow } from "../../container/use-flows";
import * as AppShell from "../../layouts/AppShell/AppShell";
import { SectionHeader } from "../../layouts/AppShell/AppShell";
import { useTheme } from "ui/client/use-theme";

export function FlowEdit({ params }) {
   const { app } = useBknd();
   const { theme } = useTheme();
   const prefix = app.getAbsolutePath("settings");
   const [location, navigate] = useLocation();
   const [execution, setExecution] = useState<Execution>();
   const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
   const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);

   console.log("key", params, params.flow);
   const { flow } = useFlow(params.flow);
   console.log("--flow", flow);

   async function handleRun() {
      console.log("Running flow", flow);
      const execution = flow.createExecution();
      setExecution(execution);

      // delay a bit before starting
      execution.emgr.onEvent(
         ExecutionState,
         async (event) => {
            if (event.params.state === "started") {
               await new Promise((resolve) => setTimeout(resolve, 100));
            }
         },
         "sync",
      );

      execution.subscribe(async (event) => {
         console.log("[event]", event);
      });
      await new Promise((resolve) => setTimeout(resolve, 100));

      execution.start();
   }

   function goBack(state?: Record<string, any>) {
      window.history.go(-1);
   }

   useOnSelectionChange({
      onChange: ({ nodes, edges }) => {
         setSelectedNodes(nodes);
         setSelectedEdges(edges);
      },
   });

   return (
      <>
         <AppShell.Sidebar>
            <AppShell.SectionHeader
               right={
                  <a href="#" className="link p-1 rounded-md hover:bg-primary/5 flex items-center">
                     <TbSettings size={20} />
                  </a>
               }
            >
               Tasks
            </AppShell.SectionHeader>
            <AppShell.Scrollable initialOffset={96}>
               <Sidebar edges={selectedEdges} nodes={selectedNodes} flow={flow} />
            </AppShell.Scrollable>
         </AppShell.Sidebar>
         <main className="flex flex-col flex-grow">
            <SectionHeader
               right={
                  <>
                     <Dropdown
                        items={[
                           {
                              label: "Settings",
                              onClick: () => navigate(`${prefix}/flows/flows/${flow.name}`),
                           },
                        ]}
                        position="bottom-end"
                     >
                        <IconButton Icon={TbDots} />
                     </Dropdown>
                     <Button variant="primary" IconLeft={TbPlayerPlayFilled} onClick={handleRun}>
                        Run
                     </Button>
                  </>
               }
               className="pl-3"
            >
               <AppShell.SectionHeaderTitle className="flex flex-row items-center gap-2">
                  <IconButton
                     onClick={goBack}
                     Icon={TbArrowLeft}
                     variant="default"
                     size="lg"
                     className="mr-1"
                  />
                  <div className="truncate">
                     <span className="text-primary/60">Flow / </span>
                     {flow.name}
                  </div>
               </AppShell.SectionHeaderTitle>
            </SectionHeader>
            <div className="w-full h-full">
               <FlowCanvas flow={flow} execution={execution} options={{ theme }} key={theme} />
            </div>
         </main>
      </>
   );
}

function Sidebar({ nodes, edges, flow }: { flow: Flow; nodes: Node[]; edges: Edge[] }) {
   const selectedNode = nodes?.[0];
   // @ts-ignore
   const selectedTask: Task | undefined = selectedNode?.data?.task;

   useEffect(() => {
      console.log("-- selected", selectedTask);
   }, [selectedTask]);

   const tasks = flow.getSequence().flat();

   const Header = ({ onClick, opened, task }) => (
      <div
         className={twMerge(
            "flex flex-row pl-5 pr-3 py-3 border-muted border-b cursor-pointer justify-between items-center font-bold",
            opened && "bg-primary/5",
         )}
         onClick={onClick}
      >
         {task.name}
         {opened ? <TbChevronUp size={18} /> : <TbChevronDown size={18} />}
      </div>
   );

   return (
      <div className="flex flex-col flex-grow">
         {tasks.map((task) => {
            const open = task.name === selectedTask?.name;
            return (
               <Collapsible
                  key={task.name}
                  className="flex flex-col"
                  header={(props) => <Header {...props} task={task} />}
                  open={open}
               >
                  <div className="flex flex-col pl-5 pr-3 py-3">
                     <TaskForm task={task} onChange={console.log} />
                  </div>
               </Collapsible>
            );
         })}
      </div>
   );
}

type CollapsibleProps = {
   header: (props: any) => any;
   className?: string;
   children: React.ReactNode;
   open?: boolean;
};

function Collapsible({ header, children, open = false, className }: CollapsibleProps) {
   const [opened, setOpened] = useState(open);

   function toggle() {
      setOpened((prev) => !prev);
   }

   useEffect(() => {
      setOpened(open);
   }, [open]);

   return (
      <div className={twMerge("flex flex-col", className)}>
         {header?.({ onClick: toggle, opened })}
         {opened && children}
      </div>
   );
}
