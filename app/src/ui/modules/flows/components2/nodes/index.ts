import { SelectNode } from "./SelectNode";
import { TaskNode } from "./tasks/TaskNode";
import { TriggerNode } from "./triggers/TriggerNode";

export const nodeTypes = {
   select: SelectNode,
   trigger: TriggerNode,
   task: TaskNode
};
