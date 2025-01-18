import type { Event } from "./Event";
import type { EventClass } from "./EventManager";

export const ListenerModes = ["sync", "async"] as const;
export type ListenerMode = (typeof ListenerModes)[number];

export type ListenerHandler<E extends Event<any, any>> = (
   event: E,
   slug: string
) => E extends Event<any, infer R> ? R | Promise<R | void> : never;

export class EventListener<E extends Event = Event> {
   mode: ListenerMode = "async";
   event: EventClass;
   handler: ListenerHandler<E>;
   once: boolean = false;

   constructor(event: EventClass, handler: ListenerHandler<E>, mode: ListenerMode = "async") {
      this.event = event;
      this.handler = handler;
      this.mode = mode;
   }
}
