import { Handle, Position } from "@xyflow/react";
import type { TaskRenderProps } from "flows";
import type { IconType } from "react-icons";
import { TbCircleLetterT } from "react-icons/tb";
import { TaskForm } from "../form/TaskForm";

export type TaskComponentProps = TaskRenderProps & {
   Icon?: IconType;
   children?: React.ReactNode;
};

export function TaskComponent({ children, Icon = TbCircleLetterT, ...props }: TaskComponentProps) {
   const { task, state } = props.data;

   return (
      <>
         <Handle
            type="target"
            position={props.targetPosition ?? Position.Top}
            isConnectable={props.isConnectable}
         />
         <div
            data-selected={props.selected ? 1 : undefined}
            className="flex flex-col rounded bg-background/80 border border-muted data-[selected]:bg-background data-[selected]:ring-2 ring-primary/40 w-[500px] cursor-auto"
         >
            <div className="flex flex-row gap-2 px-3 py-2 items-center justify-between drag-handle cursor-grab">
               <div className="flex flex-row gap-2 items-center">
                  <Icon size={18} />
                  <div className="font-medium">{task.label}</div>
               </div>
               <div
                  data-state={state.event?.getState() ?? "idle"}
                  className="px-1.5 bg-primary/10 rounded leading-0 data-[state=running]:bg-yellow-500/30 data-[state=success]:bg-green-800/30 data-[state=error]:bg-red-800"
               >
                  {state.event?.getState() ?? "idle"}
               </div>
            </div>
            <div className="w-full h-px bg-primary/10" />
            <div className="flex flex-col gap-2 px-3 py-2">
               {children ?? <TaskForm task={task} onChange={console.log} />}
            </div>
         </div>
         {!state.isRespondingTask && (
            <Handle
               type="source"
               position={props.sourcePosition ?? Position.Bottom}
               isConnectable={props.isConnectable}
            />
         )}
      </>
   );
}
