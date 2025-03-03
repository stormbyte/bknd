import { MarkerType, type Node, Position, ReactFlowProvider } from "@xyflow/react";
import type { AppDataConfig, TAppDataEntity } from "data/data-schema";
import { useBknd } from "ui/client/BkndProvider";
import { useBkndSystemTheme } from "ui/client/schema/system/use-bknd-system";
import { Canvas } from "ui/components/canvas/Canvas";
import { layoutWithDagre } from "ui/components/canvas/layouts";
import { Panels } from "ui/components/canvas/panels";
import { EntityTableNode } from "./EntityTableNode";

function entitiesToNodes(entities: AppDataConfig["entities"]): Node<TAppDataEntity>[] {
   return Object.entries(entities ?? {}).map(([name, entity]) => {
      return {
         id: name,
         data: { label: name, ...entity },
         type: "entity",
         dragHandle: ".drag-handle",
         position: { x: 0, y: 0 },
         sourcePosition: Position.Right,
         targetPosition: Position.Left,
      };
   });
}

function relationsToEdges(relations: AppDataConfig["relations"]) {
   return Object.entries(relations ?? {}).flatMap(([name, relation]) => {
      if (relation.type === "m:n") {
         const conn_table = `${relation.source}_${relation.target}`;
         return [
            {
               id: name,
               target: relation.source,
               source: conn_table,
               targetHandle: `${relation.source}:id`,
               sourceHandle: `${conn_table}:${relation.source}_id`,
            },
            {
               id: `${name}-2`,
               target: relation.target,
               source: conn_table,
               targetHandle: `${relation.target}:id`,
               sourceHandle: `${conn_table}:${relation.target}_id`,
            },
         ];
      }

      let sourceHandle = relation.source + `:${relation.target}`;
      if (relation.config?.mappedBy) {
         sourceHandle = `${relation.source}:${relation.config?.mappedBy}`;
      }
      if (relation.type !== "poly") {
         sourceHandle += "_id";
      }

      return {
         id: name,
         source: relation.source,
         target: relation.target,
         sourceHandle,
         targetHandle: relation.target + ":id",
      };
   });
}

const nodeTypes = {
   entity: EntityTableNode.Component,
} as const;

export function DataSchemaCanvas() {
   const {
      config: { data },
   } = useBknd();
   const { theme } = useBkndSystemTheme();
   const nodes = entitiesToNodes(data.entities);
   const edges = relationsToEdges(data.relations).map((e) => ({
      ...e,
      style: {
         stroke: theme === "light" ? "#ccc" : "#666",
      },
      type: "smoothstep",
      markerEnd: {
         type: MarkerType.Arrow,
         width: 20,
         height: 20,
         color: theme === "light" ? "#aaa" : "#777",
      },
   }));

   console.log("-", data, { nodes, edges });

   const nodeLayout = layoutWithDagre({
      nodes: nodes.map((n) => ({
         id: n.id,
         ...EntityTableNode.getSize(n.data),
      })),
      edges,
      graph: {
         rankdir: "LR",
         marginx: 50,
         marginy: 50,
      },
   });

   nodeLayout.nodes.forEach((node) => {
      const n = nodes.find((n) => n.id === node.id);
      if (n) {
         n.position = { x: node.x, y: node.y };
      }
   });

   return (
      <ReactFlowProvider>
         <Canvas
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            minZoom={0.1}
            maxZoom={2}
            fitViewOptions={{
               minZoom: 0.1,
               maxZoom: 0.8,
            }}
         >
            <Panels zoom minimap />
         </Canvas>
      </ReactFlowProvider>
   );
}
