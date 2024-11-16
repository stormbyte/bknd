import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { Guard } from "../../src/auth";
import { parse } from "../../src/core/utils";
import {
   Entity,
   type EntityData,
   EntityManager,
   ManyToOneRelation,
   type MutatorResponse,
   type RepositoryResponse,
   TextField
} from "../../src/data";
import { DataController } from "../../src/data/api/DataController";
import { dataConfigSchema } from "../../src/data/data-schema";
import { disableConsoleLog, enableConsoleLog, getDummyConnection } from "../helper";

const { dummyConnection, afterAllCleanup } = getDummyConnection();
beforeAll(() => disableConsoleLog(["log", "warn"]));
afterAll(async () => (await afterAllCleanup()) && enableConsoleLog());

const dataConfig = parse(dataConfigSchema, {});
describe("[data] DataController", async () => {
   test("repoResult", async () => {
      const em = new EntityManager<any>([], dummyConnection);
      const ctx: any = { em, guard: new Guard() };
      const controller = new DataController(ctx, dataConfig);

      const res = controller.repoResult({
         entity: null as any,
         data: [] as any,
         sql: "",
         parameters: [] as any,
         result: [] as any,
         meta: {
            total: 0,
            count: 0,
            items: 0
         }
      });

      expect(res).toEqual({
         meta: {
            total: 0,
            count: 0,
            items: 0
         },
         data: []
      });
   });

   test("mutatorResult", async () => {
      const em = new EntityManager([], dummyConnection);
      const ctx: any = { em, guard: new Guard() };
      const controller = new DataController(ctx, dataConfig);

      const res = controller.mutatorResult({
         entity: null as any,
         data: [] as any,
         sql: "",
         parameters: [] as any,
         result: [] as any
      });

      expect(res).toEqual({
         data: []
      });
   });

   describe("getController", async () => {
      const users = new Entity("users", [
         new TextField("name", { required: true }),
         new TextField("bio")
      ]);
      const posts = new Entity("posts", [new TextField("content")]);
      const em = new EntityManager([users, posts], dummyConnection, [
         new ManyToOneRelation(posts, users)
      ]);

      await em.schema().sync({ force: true });

      const fixtures = {
         users: [
            { name: "foo", bio: "bar" },
            { name: "bar", bio: null },
            { name: "baz", bio: "!!!" }
         ],
         posts: [
            { content: "post 1", users_id: 1 },
            { content: "post 2", users_id: 2 }
         ]
      };

      const ctx: any = { em, guard: new Guard() };
      const controller = new DataController(ctx, dataConfig);
      const app = controller.getController();

      test("entityExists", async () => {
         expect(controller.entityExists("users")).toBe(true);
         expect(controller.entityExists("posts")).toBe(true);
         expect(controller.entityExists("settings")).toBe(false);
      });

      // @todo: update
      test("/ (get info)", async () => {
         const res = await app.request("/");
         const data = (await res.json()) as any;
         const entities = Object.keys(data.entities);
         const relations = Object.values(data.relations).map((r: any) => r.type);

         expect(entities).toEqual(["users", "posts"]);
         expect(relations).toEqual(["n:1"]);
      });

      test("/:entity (insert one)", async () => {
         //console.log("app.routes", app.routes);
         // create users
         for await (const _user of fixtures.users) {
            const res = await app.request("/users", {
               method: "POST",
               body: JSON.stringify(_user)
            });
            //console.log("res", { _user }, res);
            const result = (await res.json()) as MutatorResponse;
            const { id, ...data } = result.data as any;

            expect(res.status).toBe(201);
            expect(res.ok).toBe(true);
            expect(data as any).toEqual(_user);
         }

         // create posts
         for await (const _post of fixtures.posts) {
            const res = await app.request("/posts", {
               method: "POST",
               body: JSON.stringify(_post)
            });
            const result = (await res.json()) as MutatorResponse;
            const { id, ...data } = result.data as any;

            expect(res.status).toBe(201);
            expect(res.ok).toBe(true);
            expect(data as any).toEqual(_post);
         }
      });

      test("/:entity (read many)", async () => {
         const res = await app.request("/users");
         const data = (await res.json()) as RepositoryResponse;

         expect(data.meta.total).toBe(3);
         expect(data.meta.count).toBe(3);
         expect(data.meta.items).toBe(3);
         expect(data.data.length).toBe(3);
         expect(data.data[0].name).toBe("foo");
      });

      test("/:entity/query (func query)", async () => {
         const res = await app.request("/users/query", {
            method: "POST",
            headers: {
               "Content-Type": "application/json"
            },
            body: JSON.stringify({
               where: { bio: { $isnull: 1 } }
            })
         });
         const data = (await res.json()) as RepositoryResponse;

         expect(data.meta.total).toBe(3);
         expect(data.meta.count).toBe(1);
         expect(data.meta.items).toBe(1);
         expect(data.data.length).toBe(1);
         expect(data.data[0].name).toBe("bar");
      });

      test("/:entity (read many, paginated)", async () => {
         const res = await app.request("/users?limit=1&offset=2");
         const data = (await res.json()) as RepositoryResponse;

         expect(data.meta.total).toBe(3);
         expect(data.meta.count).toBe(3);
         expect(data.meta.items).toBe(1);
         expect(data.data.length).toBe(1);
         expect(data.data[0].name).toBe("baz");
      });

      test("/:entity/:id (read one)", async () => {
         const res = await app.request("/users/3");
         const data = (await res.json()) as RepositoryResponse<EntityData>;
         console.log("data", data);

         expect(data.meta.total).toBe(3);
         expect(data.meta.count).toBe(1);
         expect(data.meta.items).toBe(1);
         expect(data.data).toEqual({ id: 3, ...fixtures.users[2] });
      });

      test("/:entity (update one)", async () => {
         const res = await app.request("/users/3", {
            method: "PATCH",
            body: JSON.stringify({ name: "new name" })
         });
         const { data } = (await res.json()) as MutatorResponse;

         expect(res.ok).toBe(true);
         expect(data as any).toEqual({ id: 3, ...fixtures.users[2], name: "new name" });
      });

      test("/:entity/:id/:reference (read references)", async () => {
         const res = await app.request("/users/1/posts");
         const data = (await res.json()) as RepositoryResponse;
         console.log("data", data);

         expect(data.meta.total).toBe(2);
         expect(data.meta.count).toBe(1);
         expect(data.meta.items).toBe(1);
         expect(data.data.length).toBe(1);
         expect(data.data[0].content).toBe("post 1");
      });

      test("/:entity/:id (delete one)", async () => {
         const res = await app.request("/posts/2", {
            method: "DELETE"
         });
         const { data } = (await res.json()) as RepositoryResponse<EntityData>;
         expect(data).toEqual({ id: 2, ...fixtures.posts[1] });

         // verify
         const res2 = await app.request("/posts");
         const data2 = (await res2.json()) as RepositoryResponse;
         expect(data2.meta.total).toBe(1);
      });
   });
});
