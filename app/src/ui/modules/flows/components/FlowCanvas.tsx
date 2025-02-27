import {
   Background,
   BackgroundVariant,
   Controls,
   type Edge,
   MiniMap,
   type Node,
   type NodeChange,
   ReactFlow,
   addEdge,
   useEdgesState,
   useNodesState,
   useStore,
} from "@xyflow/react";
import { type Execution, ExecutionEvent, ExecutionState, type Flow, type Task } from "flows";
import { transform } from "lodash-es";
import { useCallback, useEffect, useMemo } from "react";
//import "reactflow/dist/style.css";
import { getFlowEdges, getFlowNodes, getNodeTypes } from "../utils";
import { FetchTaskComponent } from "./tasks/FetchTaskComponent";
import { TaskComponent } from "./tasks/TaskComponent";

export default function FlowCanvas({
   flow,
   execution,
   options = {
      theme: "dark",
   },
}: {
   flow: Flow;
   execution: Execution | undefined;
   options?: { theme?: string };
}) {
   const nodes = getFlowNodes(flow);
   const edges = getFlowEdges(flow);
   console.log("nodes", nodes);
   console.log("edges", edges);

   const nodeTypes = getNodeTypes(flow);
   //console.log("nodeTypes", nodeTypes);

   return (
      <RenderedFlow
         nodes={nodes}
         edges={edges}
         nodeTypes={nodeTypes}
         execution={execution}
         theme={options.theme}
      />
   );
}

function RenderedFlow({ nodes, edges, nodeTypes, execution, theme }: any) {
   const [_nodes, setNodes, onNodesChange] = useNodesState(nodes);
   const [_edges, setEdges, onEdgesChange] = useEdgesState(edges);

   const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

   useEffect(() => {
      execution?.subscribe(async (event: ExecutionEvent | ExecutionState) => {
         if (event instanceof ExecutionEvent) {
            setNodes((nodes) => {
               return nodes.map((node) => {
                  // @ts-ignore
                  if (node.data.task && node.data.task.name === event.task().name) {
                     return {
                        ...node,
                        data: {
                           ...node.data,
                           state: {
                              // @ts-ignore
                              ...node.data.state,
                              event,
                           },
                        },
                     };
                  }

                  return node;
               });
            });
         } else if (event instanceof ExecutionState) {
            if (event.params.state === "started") {
               console.log("!!!!! started");
               setNodes((nodes) => {
                  return nodes.map((node) => ({
                     ...node,
                     data: {
                        ...node.data,
                        state: {
                           // @ts-ignore
                           ...node.data.state,
                           event: undefined,
                        },
                     },
                  }));
               });
            } else {
               console.log("---result", execution?.getResponse());
            }
            console.log("!!! ExecutionState", event, event.params.state);
         }
         /*console.log(
            "[event--]",
            event.isStart() ? "start" : "end",
            event.task().name,
            event.isStart() ? undefined : event.succeeded(),
         );*/
      });
   }, [execution]);

   function handleNodeClick(event: React.MouseEvent, _node: Node) {
      console.log("node click", _node);
   }

   function handleNodesChange(changes: NodeChange[]) {
      console.log("changes", changes);
   }

   return (
      <ReactFlow
         nodes={_nodes}
         edges={_edges}
         onNodesChange={onNodesChange}
         onEdgesChange={onEdgesChange}
         onEdgeClick={(e, edge) => console.log("edge clicked", edge)}
         onNodeClick={handleNodeClick}
         nodeDragThreshold={10}
         nodeTypes={nodeTypes}
         onConnect={onConnect}
         fitView
         fitViewOptions={{ maxZoom: 1 }}
         proOptions={{
            hideAttribution: true,
         }}
      >
         <Controls>
            <ZoomState />
         </Controls>
         <MiniMap />
         <Background
            key={theme}
            color={theme === "dark" ? "rgba(255,255,255,.2)" : "rgba(0,0,0,.2)"}
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1.5}
         />
      </ReactFlow>
   );
}

const zoomStore = (state) => {
   return state.transform[2];
};
const ZoomState = () => {
   const zoom = useStore(zoomStore);
   return <div>{Math.ceil(zoom * 100).toFixed(0)}%</div>;
};
