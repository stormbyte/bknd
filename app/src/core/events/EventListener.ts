import type { Event } from "./Event";
import type { EventClass } from "./EventManager";

export const ListenerModes = ["sync", "async"] as const;
export type ListenerMode = (typeof ListenerModes)[number];

export type ListenerHandler<E extends Event = Event> = (
   event: E,
   slug: string,
) => Promise<void> | void;

export class EventListener<E extends Event = Event> {
   mode: ListenerMode = "async";
   event: EventClass;
   handler: ListenerHandler<E>;

   constructor(event: EventClass, handler: ListenerHandler<E>, mode: ListenerMode = "async") {
      this.event = event;
      this.handler = handler;
      this.mode = mode;
   }
}
