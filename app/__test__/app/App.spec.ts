import { describe, expect, mock, test } from "bun:test";
import type { ModuleBuildContext } from "../../src";
import { type App, createApp } from "../../src/App";
import * as proto from "../../src/data/prototype";

describe("App", () => {
   test("seed includes ctx and app", async () => {
      const called = mock(() => null);
      await createApp({
         options: {
            seed: async ({ app, ...ctx }) => {
               called();
               expect(app).toBeDefined();
               expect(ctx).toBeDefined();
               expect(Object.keys(ctx)).toEqual([
                  "connection",
                  "server",
                  "em",
                  "emgr",
                  "guard",
                  "flags",
                  "logger",
               ]);
            },
         },
      }).build();
      expect(called).toHaveBeenCalled();

      const app = createApp({
         initialConfig: {
            data: proto
               .em({
                  todos: proto.entity("todos", {
                     title: proto.text(),
                  }),
               })
               .toJSON(),
         },
         options: {
            //manager: { verbosity: 2 },
            seed: async ({ app, ...ctx }: ModuleBuildContext & { app: App }) => {
               await ctx.em.mutator("todos").insertOne({ title: "ctx" });
               await app.getApi().data.createOne("todos", { title: "api" });
            },
         },
      });
      await app.build();

      const todos = await app.getApi().data.readMany("todos");
      expect(todos.length).toBe(2);
      expect(todos[0]?.title).toBe("ctx");
      expect(todos[1]?.title).toBe("api");
   });
});
