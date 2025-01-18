import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { Guard } from "../../src/auth";
import { parse } from "../../src/core/utils";
import { DataApi } from "../../src/data/api/DataApi";
import { DataController } from "../../src/data/api/DataController";
import { dataConfigSchema } from "../../src/data/data-schema";
import * as proto from "../../src/data/prototype";
import { disableConsoleLog, enableConsoleLog, schemaToEm } from "../helper";

beforeAll(disableConsoleLog);
afterAll(enableConsoleLog);

const dataConfig = parse(dataConfigSchema, {});
describe("DataApi", () => {
   it("should switch to post for long url reads", async () => {
      const api = new DataApi();

      const get = api.readMany("a".repeat(300), { select: ["id", "name"] });
      expect(get.request.method).toBe("GET");
      expect(new URL(get.request.url).pathname).toBe(`/api/data/${"a".repeat(300)}`);

      const post = api.readMany("a".repeat(1000), { select: ["id", "name"] });
      expect(post.request.method).toBe("POST");
      expect(new URL(post.request.url).pathname).toBe(`/api/data/${"a".repeat(1000)}/query`);
   });

   it("returns result", async () => {
      const schema = proto.em({
         posts: proto.entity("posts", { title: proto.text() })
      });
      const em = schemaToEm(schema);
      await em.schema().sync({ force: true });

      const payload = [{ title: "foo" }, { title: "bar" }, { title: "baz" }];
      await em.mutator("posts").insertMany(payload);

      const ctx: any = { em, guard: new Guard() };
      const controller = new DataController(ctx, dataConfig);
      const app = controller.getController();

      {
         const res = (await app.request("/posts")) as Response;
         const { data } = await res.json();
         expect(data.length).toEqual(3);
      }

      // @ts-ignore tests
      const api = new DataApi({ basepath: "/", queryLengthLimit: 50 });
      // @ts-ignore protected
      api.fetcher = app.request as typeof fetch;
      {
         const req = api.readMany("posts", { select: ["title"] });
         expect(req.request.method).toBe("GET");
         const res = await req;
         expect(res.data).toEqual(payload);
      }

      {
         const req = api.readMany("posts", {
            select: ["title"],
            limit: 100000,
            offset: 0,
            sort: "id"
         });
         expect(req.request.method).toBe("POST");
         const res = await req;
         expect(res.data).toEqual(payload);
      }
   });
});
