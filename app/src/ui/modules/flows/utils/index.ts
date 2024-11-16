import type { Edge, Node } from "@xyflow/react";
import type { Flow } from "flows";
import { TriggerComponent } from "../components/TriggerComponent";
import { FetchTaskComponent } from "../components/tasks/FetchTaskComponent";
import { RenderTaskComponent } from "../components/tasks/RenderTaskComponent";
import { TaskComponent } from "../components/tasks/TaskComponent";

export function calculateTaskPositions(numTasks: number, offset: number): number[] {
   if (numTasks === 1) {
      return [0];
   }
   const positions: number[] = [];
   const totalOffset = (numTasks - 1) * offset;
   const startPosition = -totalOffset / 2;
   for (let i = 0; i < numTasks; i++) {
      positions.push(startPosition + i * offset);
   }
   return positions;
}

export function getFlowNodes(flow: Flow): Node[] {
   const nodes: Node[] = [];
   const spacing = { x: 200, y: 400 };
   const spacePerLine = 26;

   // add trigger
   nodes.push({
      id: "trigger",
      type: "trigger",
      position: { x: 0, y: 0 },
      data: { trigger: flow.trigger },
      dragHandle: ".drag-handle"
   });
   console.log("adding node", { id: "trigger" });

   // @todo: doesn't include unconnected tasks
   flow.getSequence().forEach((step, i) => {
      const step_count = step.length;
      const height = step.reduce((acc, task) => acc + task.name.length, 0) * spacePerLine;

      step.forEach((task, j) => {
         const xs = calculateTaskPositions(step_count, spacing.x);
         const isRespondingTask = flow.respondingTask?.name === task.name;
         const isStartTask = flow.startTask.name === task.name;
         nodes.push({
            id: task.name,
            type: task.type,
            position: { x: xs[j]!, y: (i + 1) * spacing.y },
            data: { task, state: { i: 0, isRespondingTask, isStartTask, event: undefined } },
            dragHandle: ".drag-handle"
         });
      });
   });
   return nodes;
}

export function getFlowEdges(flow: Flow): Edge[] {
   const edges: Edge[] = [];
   const startTask = flow.startTask;
   const trigger = flow.trigger;

   // add trigger connection
   edges.push({
      id: `trigger-${startTask.name}${new Date().getTime()}`,
      source: "trigger",
      target: startTask.name
      //type: "",
   });

   // add task connections
   flow.connections.forEach((c) => {
      edges.push({
         id: `${c.source.name}-${c.target.name}${new Date().getTime()}`,
         source: c.source.name,
         target: c.target.name
         //type: "",
      });
   });
   return edges;
}

export function getNodeTypes(flow: Flow) {
   return {
      trigger: TriggerComponent,
      render: RenderTaskComponent,
      log: TaskComponent,
      fetch: TaskComponent
   };
}
