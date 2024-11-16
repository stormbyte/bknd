import { describe, test } from "bun:test";
import type { TObject, TString } from "@sinclair/typebox";
import { Registry } from "../../src/core/registry/Registry";
import { type TSchema, Type } from "../../src/core/utils";

type Constructor<T> = new (...args: any[]) => T;

type ClassRef<T> = Constructor<T> & (new (...args: any[]) => T);

class What {
   method() {
      return null;
   }
}
class What2 extends What {}
class NotAllowed {}

type Test1 = {
   cls: new (...args: any[]) => What;
   schema: TObject<{ type: TString }>;
   enabled: boolean;
};

describe("Registry", () => {
   test("adds an item", async () => {
      const registry = new Registry<Test1>().set({
         first: {
            cls: What,
            schema: Type.Object({ type: Type.String(), what: Type.String() }),
            enabled: true
         }
      } satisfies Record<string, Test1>);

      const item = registry.get("first");

      registry.add("second", {
         cls: What2,
         schema: Type.Object({ type: Type.String(), what: Type.String() }),
         enabled: true
      });
      registry.add("third", {
         // @ts-expect-error
         cls: NotAllowed,
         schema: Type.Object({ type: Type.String({ default: "1" }), what22: Type.String() }),
         enabled: true
      });
      registry.add("fourth", {
         cls: What,
         // @ts-expect-error
         schema: Type.Object({ type: Type.Number(), what22: Type.String() }),
         enabled: true
      });

      console.log("list", registry.all());
   });
});
