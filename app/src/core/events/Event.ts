export abstract class Event<Params = any> {
   /**
    * Unique event slug
    * Must be static, because registering events is done by class
    */
   static slug: string = "untitled-event";
   params: Params;

   constructor(params: Params) {
      this.params = params;
   }
}

// @todo: current workaround: potentially there is none and that's the way
export class NoParamEvent extends Event<null> {
   static override slug: string = "noparam-event";

   constructor() {
      super(null);
   }
}
