import { describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { secureRandomString } from "../../src/core/utils";
import { ModuleApi } from "../../src/modules";

class Api extends ModuleApi {
   _getUrl(path: string) {
      return this.getUrl(path);
   }
}

const host = "http://localhost";

describe("ModuleApi", () => {
   it("resolves options correctly", () => {
      const api = new Api({ host });
      expect(api.options).toEqual({ host });
   });

   it("returns correct url from path", () => {
      const api = new Api({ host });
      expect(api._getUrl("/test")).toEqual("http://localhost/test");
      expect(api._getUrl("test")).toEqual("http://localhost/test");
      expect(api._getUrl("test/")).toEqual("http://localhost/test");
      expect(api._getUrl("//test?foo=1")).toEqual("http://localhost/test?foo=1");
   });

   it("fetches endpoint", async () => {
      const app = new Hono().get("/endpoint", (c) => c.json({ foo: "bar" }));
      const api = new Api({ host }, app.request as typeof fetch);

      const res = await api.get("/endpoint");
      expect(res.res.ok).toEqual(true);
      expect(res.res.status).toEqual(200);
      expect(res.data).toEqual({ foo: "bar" });
      expect(res.body).toEqual({ foo: "bar" });
   });

   it("has accessible request", async () => {
      const app = new Hono().get("/endpoint", (c) => c.json({ foo: "bar" }));
      const api = new Api({ host }, app.request as typeof fetch);

      const promise = api.get("/endpoint");
      expect(promise.request).toBeDefined();
      expect(promise.request.url).toEqual("http://localhost/endpoint");

      expect((await promise).body).toEqual({ foo: "bar" });
   });

   it("adds token to headers when given in options", () => {
      const token = secureRandomString(20);
      const api = new Api({ host, token, token_transport: "header" });

      expect(api.get("/").request.headers.get("Authorization")).toEqual(`Bearer ${token}`);
   });

   it("sets header to accept json", () => {
      const api = new Api({ host });
      expect(api.get("/").request.headers.get("Accept")).toEqual("application/json");
   });

   it("adds additional headers from options", () => {
      const headers = new Headers({
         "X-Test": "123"
      });
      const api = new Api({ host, headers });
      expect(api.get("/").request.headers.get("X-Test")).toEqual("123");
   });

   it("uses basepath & removes trailing slash", () => {
      const api = new Api({ host, basepath: "/api" });
      expect(api.get("/").request.url).toEqual("http://localhost/api");
   });

   it("uses search params", () => {
      const api = new Api({ host });
      const search = new URLSearchParams({
         foo: "bar"
      });
      expect(api.get("/", search).request.url).toEqual("http://localhost/?" + search.toString());
   });

   it("resolves method shortcut fns correctly", () => {
      const api = new Api({ host });
      expect(api.get("/").request.method).toEqual("GET");
      expect(api.post("/").request.method).toEqual("POST");
      expect(api.put("/").request.method).toEqual("PUT");
      expect(api.patch("/").request.method).toEqual("PATCH");
      expect(api.delete("/").request.method).toEqual("DELETE");
   });

   // @todo: test error response
   // @todo: test method shortcut functions
});
