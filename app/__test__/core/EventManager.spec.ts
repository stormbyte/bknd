import { describe, expect, test } from "bun:test";
import { Event, EventManager, NoParamEvent } from "../../src/core/events";

class SpecialEvent extends Event<{ foo: string }> {
   static slug = "special-event";

   isBar() {
      return this.params.foo === "bar";
   }
}

class InformationalEvent extends NoParamEvent {
   static slug = "informational-event";
}

describe("EventManager", async () => {
   test("test", async () => {
      const emgr = new EventManager();
      emgr.registerEvents([SpecialEvent, InformationalEvent]);

      emgr.onEvent(
         SpecialEvent,
         async (event, name) => {
            console.log("Event: ", name, event.params.foo, event.isBar());
            console.log("wait...");

            await new Promise((resolve) => setTimeout(resolve, 100));
            console.log("done waiting");
         },
         "sync"
      );

      emgr.onEvent(InformationalEvent, async (event, name) => {
         console.log("Event: ", name, event.params);
      });

      await emgr.emit(new SpecialEvent({ foo: "bar" }));
      console.log("done");

      // expect construct signatures to not cause ts errors
      new SpecialEvent({ foo: "bar" });
      new InformationalEvent();

      expect(true).toBe(true);
   });
});
