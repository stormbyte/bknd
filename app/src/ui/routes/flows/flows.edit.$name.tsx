import { Slider, Tabs } from "@mantine/core";
import { MarkerType, ReactFlowProvider } from "@xyflow/react";
import { objectDepth } from "core/utils";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { pick, throttle } from "lodash-es";
import { useEffect, useRef, useState } from "react";
import { TbArrowLeft } from "react-icons/tb";
import { Canvas } from "ui/components/canvas/Canvas";
import { Panels } from "ui/components/canvas/panels";
import { Panel } from "ui/components/canvas/panels/Panel";
import { nodeTypes } from "ui/modules/flows/components2/nodes";
import {
   FlowCanvasProvider,
   flowToEdges,
   flowToNodes,
   useFlowCanvas,
   useFlowCanvasState,
   useFlowSelector
} from "ui/modules/flows/hooks/use-flow";
import { JsonViewer } from "../../components/code/JsonViewer";
import { routes, useGoBack, useNavigate } from "../../lib/routes";

/**
 * @todo: AppFlows config must be updated to have fixed ids per task and connection
 * ideally in array format
 *
 */

export function FlowsEdit(props) {
   return (
      <FlowCanvasProvider name={props.params.flow}>
         <ReactFlowProvider>
            <FlowsEditInner />
         </ReactFlowProvider>
      </FlowCanvasProvider>
   );
}

function FlowsEditInner() {
   const ref = useRef<HTMLDivElement>(null);
   const [rect, setRect] = useState<DOMRect>();
   const $flow = useFlowCanvas();
   if (!$flow.data || !$flow.name) return "no flow";

   useEffect(() => {
      // get width and height of ref object
      console.log("ref", ref.current?.getBoundingClientRect());
      setRect(ref.current?.getBoundingClientRect());
   }, []);

   const nodes = flowToNodes($flow.data, $flow.name);
   const edges = flowToEdges($flow.data) as any;
   console.log("nodes", nodes);
   console.log("edges", edges);

   const triggerHeight = 260;
   const offset = 50;
   const viewport = {
      zoom: 1,
      x: rect?.width ? rect.width * 0.1 : 0,
      y: rect?.height ? rect.height / 2 - triggerHeight / 2 - offset : 0
   };

   return (
      <div className="flex flex-col w-full h-full" ref={ref}>
         {rect && (
            <>
               <Canvas
                  externalProvider
                  backgroundStyle="dots"
                  nodes={nodes}
                  edges={edges}
                  nodeTypes={nodeTypes}
                  nodeDragThreshold={0}
                  fitView={false}
                  defaultViewport={viewport}
                  nodesConnectable={true}
                  onDropNewNode={(node) => ({
                     ...node,
                     type: "select",
                     data: { label: "" }
                  })}
                  onDropNewEdge={(edge) => ({
                     ...edge,
                     style: {
                        strokeWidth: 2
                     },
                     markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 10,
                        height: 10
                     }
                  })}
               >
                  <FlowPanels />
               </Canvas>
               <Debugger />
            </>
         )}
      </div>
   );
}

function FlowPanels() {
   const state = useFlowSelector((s) => pick(s, ["name", "dirty"]));

   const [navigate] = useNavigate();
   const { goBack } = useGoBack(() => navigate(routes.flows.flows.list()));
   return (
      <Panels minimap zoom>
         <Panel position="top-left" className="gap-2 pr-6">
            <Panel.IconButton Icon={TbArrowLeft} round onClick={goBack} />
            <Panel.Text>
               {state.name} {state.dirty ? "*" : ""}
            </Panel.Text>
         </Panel>
      </Panels>
   );
}
/*
function PanelsOld() {
   //console.log("Panels");
   const state = useFlowSelector((s) => pick(s, ["name", "dirty"]));

   const [navigate] = useNavigate();
   const { goBack } = useGoBack(() => navigate(routes.flows.flows.list()));

   const [minimap, setMinimap] = useState(false);
   const reactFlow = useReactFlow();
   const { zoom, x, y } = useViewport();
   const percent = Math.round(zoom * 100);

   const handleZoomIn = async () => await reactFlow.zoomIn();
   const handleZoomReset = async () => reactFlow.zoomTo(1);
   const handleZoomOut = async () => await reactFlow.zoomOut();
   function toggleMinimap() {
      setMinimap((p) => !p);
   }

   return (
      <>
         <FlowPanel position="top-left" className="gap-2 pr-6">
            <FlowPanel.IconButton Icon={TbArrowLeft} round onClick={goBack} />
            <FlowPanel.Text>
               {state.name} {state.dirty ? "*" : ""}
            </FlowPanel.Text>
         </FlowPanel>
         <FlowPanel position="bottom-center">
            <FlowPanel.Text className="px-2" mono>
               {x.toFixed(2)},{y.toFixed(2)}
            </FlowPanel.Text>
         </FlowPanel>
         <FlowPanel unstyled position="bottom-right">
            <FlowPanel.Wrapper className="px-1.5">
               <FlowPanel.IconButton Icon={TbPlus} round onClick={handleZoomIn} />
               <FlowPanel.Text className="px-2" mono onClick={handleZoomReset}>
                  {percent}%
               </FlowPanel.Text>
               <FlowPanel.IconButton Icon={TbMinus} round onClick={handleZoomOut} />
               <FlowPanel.IconButton Icon={TbMaximize} round onClick={handleZoomReset} />
            </FlowPanel.Wrapper>
            <FlowPanel.Wrapper>
               <FlowPanel.IconButton
                  Icon={minimap ? TbSitemap : TbSitemap}
                  round
                  onClick={toggleMinimap}
                  variant={minimap ? "default" : "ghost"}
               />
            </FlowPanel.Wrapper>
            {minimap && <MiniMap style={{ bottom: 50, right: -5 }} ariaLabel={null} />}
         </FlowPanel>
      </>
   );
}*/

type DebuggerTabProps = {
   tab: string | null;
   store?: Record<string, any>;
};

const debuggerTabAtom = atomWithStorage<DebuggerTabProps>("__dev_flow_debugger_tab", { tab: null });
const Debugger = () => {
   const [_state, _setState] = useAtom(debuggerTabAtom);
   const $flow = useFlowCanvas();
   const state = useFlowCanvasState();

   function handleTabChange(tab: string | null) {
      _setState((prev) => ({ ...prev, tab: prev.tab === tab ? null : tab }));
   }

   const expand = _state.store?.expand || 3;

   return (
      <div className="flex fixed left-5 bottom-5 z-20">
         <Tabs value={_state.tab} onChange={handleTabChange}>
            <div className="max-h-96 overflow-y-scroll bg-background/70">
               <Tabs.Panel value="store">
                  <div className="flex flex-row text-sm">
                     <JsonViewer
                        className="max-w-96 break-all"
                        title="Context"
                        json={{
                           name: $flow.name,
                           ...$flow.data
                        }}
                        expand={expand}
                     />
                     <JsonViewer
                        className="max-w-96 break-all"
                        title="State"
                        json={{
                           name: state.name,
                           ...state.flow
                        }}
                        expand={expand}
                     />
                  </div>
                  <Slider
                     className="w-36"
                     defaultValue={expand}
                     min={0}
                     max={objectDepth(state.flow ?? {})}
                     onChange={throttle(
                        (n) =>
                           _setState((prev) => ({
                              ...prev,
                              store: { ...prev.store, expand: n }
                           })),
                        250
                     )}
                  />
               </Tabs.Panel>
            </div>
            <Tabs.List>
               <Tabs.Tab value="store">Store</Tabs.Tab>
            </Tabs.List>
         </Tabs>
      </div>
   );
};
