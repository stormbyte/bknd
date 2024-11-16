import { EventTrigger } from "./EventTrigger";
import { HttpTrigger } from "./HttpTrigger";
import { Trigger } from "./Trigger";

export { Trigger, EventTrigger, HttpTrigger };

//export type TriggerMapType = { [key: string]: { cls: typeof Trigger } };
export const TriggerMap = {
   manual: { cls: Trigger },
   event: { cls: EventTrigger },
   http: { cls: HttpTrigger }
} as const;
export type TriggerMapType = typeof TriggerMap;
