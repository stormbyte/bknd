export abstract class Event<Params = any, Returning = void> {
   _returning!: Returning;

   /**
    * Unique event slug
    * Must be static, because registering events is done by class
    */
   static slug: string = "untitled-event";
   params: Params;
   returned: boolean = false;

   validate(value: Returning): Event<Params, Returning> | void {}

   protected clone<This extends Event<Params, Returning> = Event<Params, Returning>>(
      this: This,
      params: Params
   ): This {
      const cloned = new (this.constructor as any)(params);
      cloned.returned = true;
      return cloned as This;
   }

   constructor(params: Params) {
      this.params = params;
   }
}

// @todo: current workaround: potentially there is "none" and that's the way
export class NoParamEvent extends Event<null> {
   static override slug: string = "noparam-event";

   constructor() {
      super(null);
   }
}

export class InvalidEventReturn extends Error {
   constructor(expected: string, given: string) {
      super(`Expected "${expected}", got "${given}"`);
   }
}
