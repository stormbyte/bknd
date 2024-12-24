import type { Event } from "./Event";
import { EventListener, type ListenerHandler, type ListenerMode } from "./EventListener";

export interface EmitsEvents {
   emgr: EventManager;
}

export type EventClass = {
   new (params: any): Event;
   slug: string;
};

export class EventManager<
   RegisteredEvents extends Record<string, EventClass> = Record<string, EventClass>
> {
   protected events: EventClass[] = [];
   protected listeners: EventListener[] = [];
   enabled: boolean = true;

   constructor(events?: RegisteredEvents, listeners?: EventListener[]) {
      if (events) {
         this.registerEvents(events);
      }

      if (listeners) {
         for (const listener of listeners) {
            this.addListener(listener);
         }
      }
   }

   enable() {
      this.enabled = true;
      return this;
   }

   disable() {
      this.enabled = false;
      return this;
   }

   clearEvents() {
      this.events = [];
      return this;
   }

   clearAll() {
      this.clearEvents();
      this.listeners = [];
      return this;
   }

   getListeners(): EventListener[] {
      return [...this.listeners];
   }

   get Events(): { [K in keyof RegisteredEvents]: RegisteredEvents[K] } {
      // proxy class to access events
      return new Proxy(this, {
         get: (_, prop: string) => {
            return this.events.find((e) => e.slug === prop);
         }
      }) as any;
   }

   eventExists(slug: string): boolean;
   eventExists(event: EventClass | Event): boolean;
   eventExists(eventOrSlug: EventClass | Event | string): boolean {
      let slug: string;

      if (typeof eventOrSlug === "string") {
         slug = eventOrSlug;
      } else {
         // @ts-expect-error
         slug = eventOrSlug.constructor?.slug ?? eventOrSlug.slug;
         /*eventOrSlug instanceof Event
               ? // @ts-expect-error slug is static
                 eventOrSlug.constructor.slug
               : eventOrSlug.slug;*/
      }

      return !!this.events.find((e) => slug === e.slug);
   }

   protected throwIfEventNotRegistered(event: EventClass) {
      if (!this.eventExists(event)) {
         throw new Error(`Event "${event.slug}" not registered`);
      }
   }

   registerEvent(event: EventClass, silent: boolean = false) {
      if (this.eventExists(event)) {
         if (silent) {
            return this;
         }

         throw new Error(`Event "${event.name}" already registered.`);
      }

      this.events.push(event);
      return this;
   }

   registerEvents(eventObjects: Record<string, EventClass>): this;
   registerEvents(eventArray: EventClass[]): this;
   registerEvents(objectOrArray: Record<string, EventClass> | EventClass[]): this {
      const events =
         typeof objectOrArray === "object" ? Object.values(objectOrArray) : objectOrArray;
      events.forEach((event) => this.registerEvent(event, true));
      return this;
   }

   addListener(listener: EventListener) {
      this.throwIfEventNotRegistered(listener.event);

      this.listeners.push(listener);
      return this;
   }

   onEvent<ActualEvent extends EventClass, Instance extends InstanceType<ActualEvent>>(
      event: ActualEvent,
      handler: ListenerHandler<Instance>,
      mode: ListenerMode = "async"
   ) {
      this.throwIfEventNotRegistered(event);

      const listener = new EventListener(event, handler, mode);
      this.addListener(listener as any);
   }

   on<Params = any>(
      slug: string,
      handler: ListenerHandler<Event<Params>>,
      mode: ListenerMode = "async"
   ) {
      const event = this.events.find((e) => e.slug === slug);
      if (!event) {
         throw new Error(`Event "${slug}" not registered`);
      }

      this.onEvent(event, handler, mode);
   }

   onAny(handler: ListenerHandler<Event<unknown>>, mode: ListenerMode = "async") {
      this.events.forEach((event) => this.onEvent(event, handler, mode));
   }

   async emit(event: Event) {
      // @ts-expect-error slug is static
      const slug = event.constructor.slug;
      if (!this.enabled) {
         console.log("EventManager disabled, not emitting", slug);
         return;
      }

      if (!this.eventExists(event)) {
         throw new Error(`Event "${slug}" not registered`);
      }

      const listeners = this.listeners.filter((listener) => listener.event.slug === slug);
      //console.log("---!-- emitting", slug, listeners.length);

      for (const listener of listeners) {
         if (listener.mode === "sync") {
            await listener.handler(event, listener.event.slug);
         } else {
            listener.handler(event, listener.event.slug);
         }
      }
   }
}
