import type { ClassController } from "core";
import { SimpleRenderer } from "core";
import { FetchTask, Flow, LogTask } from "flows";
import { Hono } from "hono";
import { endTime, startTime } from "hono/timing";
import type { App } from "../../App";

export class AppController implements ClassController {
   constructor(
      private readonly app: App,
      private config: any = {}
   ) {}

   getController(): Hono {
      const hono = new Hono();

      // @todo: add test endpoints

      hono
         .get("/config", (c) => {
            return c.json(this.app.toJSON());
         })
         .get("/ping", (c) => {
            //console.log("c", c);
            try {
               // @ts-ignore @todo: fix with env
               const context: any = c.req.raw.cf ? c.req.raw.cf : c.env.cf;
               const cf = {
                  colo: context.colo,
                  city: context.city,
                  postal: context.postalCode,
                  region: context.region,
                  regionCode: context.regionCode,
                  continent: context.continent,
                  country: context.country,
                  eu: context.isEUCountry,
                  lat: context.latitude,
                  lng: context.longitude,
                  timezone: context.timezone
               };
               return c.json({ pong: true, cf, another: 6 });
            } catch (e) {
               return c.json({ pong: true, cf: null });
            }
         });

      // test endpoints
      if (this.config?.registerTest) {
         hono.get("/test/kv", async (c) => {
            // @ts-ignore
            const cache = c.env!.CACHE as KVNamespace;
            startTime(c, "kv-get");
            const value: any = await cache.get("count");
            endTime(c, "kv-get");
            console.log("value", value);
            startTime(c, "kv-put");
            if (!value) {
               await cache.put("count", "1");
            } else {
               await cache.put("count", (Number(value) + 1).toString());
            }
            endTime(c, "kv-put");

            let cf: any = {};
            // @ts-ignore
            if ("cf" in c.req.raw) {
               cf = {
                  // @ts-ignore
                  colo: c.req.raw.cf?.colo
               };
            }

            return c.json({ pong: true, value, cf });
         });

         hono.get("/test/flow", async (c) => {
            const first = new LogTask("Task 0");
            const second = new LogTask("Task 1");
            const third = new LogTask("Task 2", { delay: 250 });
            const fourth = new FetchTask("Fetch Something", {
               url: "https://jsonplaceholder.typicode.com/todos/1"
            });
            const fifth = new LogTask("Task 4"); // without connection

            const flow = new Flow("flow", [first, second, third, fourth, fifth]);
            flow.task(first).asInputFor(second);
            flow.task(first).asInputFor(third);
            flow.task(fourth).asOutputFor(third);

            flow.setRespondingTask(fourth);

            const execution = flow.createExecution();
            await execution.start();

            const results = flow.tasks.map((t) => t.toJSON());

            return c.json({ results, response: execution.getResponse() });
         });

         hono.get("/test/template", async (c) => {
            const renderer = new SimpleRenderer({ var: 123 });
            const template = "Variable: {{ var }}";

            return c.text(await renderer.render(template));
         });
      }

      return hono;
   }
}
