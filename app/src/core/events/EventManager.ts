import { type Event, InvalidEventReturn } from "./Event";
import { EventListener, type ListenerHandler, type ListenerMode } from "./EventListener";

export interface EmitsEvents {
   emgr: EventManager;
}

export type EventClass = {
   new (params: any): Event<any, any>;
   slug: string;
};

export class EventManager<
   RegisteredEvents extends Record<string, EventClass> = Record<string, EventClass>
> {
   protected events: EventClass[] = [];
   protected listeners: EventListener[] = [];
   enabled: boolean = true;

   constructor(
      events?: RegisteredEvents,
      private options?: {
         listeners?: EventListener[];
         onError?: (event: Event, e: unknown) => void;
         onInvalidReturn?: (event: Event, e: InvalidEventReturn) => void;
         asyncExecutor?: typeof Promise.all;
      }
   ) {
      if (events) {
         this.registerEvents(events);
      }

      options?.listeners?.forEach((l) => this.addListener(l));
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

   onEventOnce<ActualEvent extends EventClass, Instance extends InstanceType<ActualEvent>>(
      event: ActualEvent,
      handler: ListenerHandler<Instance>,
      mode: ListenerMode = "async"
   ) {
      this.throwIfEventNotRegistered(event);

      const listener = new EventListener(event, handler, mode);
      listener.once = true;
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

   protected executeAsyncs(promises: (() => Promise<void>)[]) {
      const executor = this.options?.asyncExecutor ?? ((e) => Promise.all(e));
      executor(promises.map((p) => p())).then(() => void 0);
   }

   async emit<Actual extends Event<any, any>>(event: Actual): Promise<Actual> {
      // @ts-expect-error slug is static
      const slug = event.constructor.slug;
      if (!this.enabled) {
         console.log("EventManager disabled, not emitting", slug);
         return event;
      }

      if (!this.eventExists(event)) {
         throw new Error(`Event "${slug}" not registered`);
      }

      const syncs: EventListener[] = [];
      const asyncs: (() => Promise<void>)[] = [];

      this.listeners = this.listeners.filter((listener) => {
         // if no match, keep and ignore
         if (listener.event.slug !== slug) return true;

         if (listener.mode === "sync") {
            syncs.push(listener);
         } else {
            asyncs.push(async () => await listener.handler(event, listener.event.slug));
         }
         // Remove if `once` is true, otherwise keep
         return !listener.once;
      });

      // execute asyncs
      this.executeAsyncs(asyncs);

      // execute syncs
      let _event: Actual = event;
      for (const listener of syncs) {
         try {
            const return_value = (await listener.handler(_event, listener.event.slug)) as any;

            if (typeof return_value !== "undefined") {
               const newEvent = _event.validate(return_value);
               // @ts-expect-error slug is static
               if (newEvent && newEvent.constructor.slug === slug) {
                  if (!newEvent.returned) {
                     throw new Error(
                        // @ts-expect-error slug is static
                        `Returned event ${newEvent.constructor.slug} must be marked as returned.`
                     );
                  }
                  _event = newEvent as Actual;
               }
            }
         } catch (e) {
            if (e instanceof InvalidEventReturn) {
               this.options?.onInvalidReturn?.(_event, e);
               console.warn(`Invalid return of event listener for "${slug}": ${e.message}`);
            } else if (this.options?.onError) {
               this.options.onError(_event, e);
            } else {
               throw e;
            }
         }
      }

      return _event;
   }
}
