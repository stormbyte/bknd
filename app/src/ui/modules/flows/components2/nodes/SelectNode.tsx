import { useReactFlow } from "@xyflow/react";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { DefaultNode } from "ui/components/canvas/components/nodes/DefaultNode";
import { useFlowCanvas } from "../../hooks/use-flow";
import { Handle } from "./Handle";

const nodes = [
   {
      type: "fetch",
      label: "Fetch",
      description: "Fetch data from a URL",
      template: {
         type: "fetch",
         params: {
            method: "GET",
            headers: [],
            url: "",
         },
      },
   },
   {
      type: "render",
      label: "Render",
      description: "Render data using LiquidJS",
   },
];

export function SelectNode(props) {
   const [selected, setSelected] = useState<string>();
   const reactflow = useReactFlow();
   const { actions } = useFlowCanvas();
   const old_id = props.id;

   async function handleMake() {
      const node = nodes.find((n) => n.type === selected)!;
      const label = "untitled";

      await actions.task.create(label, node.template);
      reactflow.setNodes((prev) =>
         prev.map((n) => {
            if (n.id === old_id) {
               return {
                  ...n,
                  id: "task-" + label,
                  type: "task",
                  data: {
                     ...node.template,
                     label,
                  },
               };
            }

            return n;
         }),
      );
      setTimeout(() => {
         reactflow.setEdges((prev) =>
            prev.map((e) => {
               console.log("edge?", e, old_id, e.target === old_id);
               if (e.target === old_id) {
                  return {
                     ...e,
                     id: "task-" + label,
                     target: "task-" + label,
                  };
               }

               return e;
            }),
         );
      }, 100);

      console.log("make", node);
   }

   //console.log("SelectNode", props);
   return (
      <DefaultNode className="w-96">
         <Handle type="target" id="select-in" />

         <DefaultNode.Header className="gap-3 justify-start py-2">
            <div className="bg-primary/10 rounded-full w-4 h-4" />
            <div className="bg-primary/5 rounded-full w-1/2 h-4" />
         </DefaultNode.Header>
         <DefaultNode.Content>
            <div>select</div>
            <div className="grid grid-cols-3 gap-2">
               {nodes.map((node) => (
                  <button
                     type="button"
                     key={node.type}
                     className={twMerge(
                        "border border-primary/10 rounded-md py-2 px-4 hover:bg-primary/10",
                        selected === node.type && "bg-primary/10",
                     )}
                     onClick={() => setSelected(node.type)}
                  >
                     {node.label}
                  </button>
               ))}
            </div>
            <button onClick={handleMake}>make</button>
         </DefaultNode.Content>
      </DefaultNode>
   );
}
