import { describe, expect, it, test } from "bun:test";
import { Endpoint } from "../../src/core";
import { mockFetch2, unmockFetch } from "./helper";

const testC: any = {
   json: (res: any) => Response.json(res)
};
const testNext = async () => {};

describe("Endpoint", async () => {
   it("behaves as expected", async () => {
      const endpoint = new Endpoint("GET", "/test", async () => {
         return { hello: "test" };
      });

      expect(endpoint.method).toBe("GET");
      expect(endpoint.path).toBe("/test");

      const handler = endpoint.toHandler();
      const response = await handler(testC, testNext);

      expect(response.ok).toBe(true);
      expect(await response.json()).toEqual({ hello: "test" });
   });

   it("can be $request(ed)", async () => {
      const obj = { hello: "test" };
      const baseUrl = "https://local.com:123";
      const endpoint = Endpoint.get("/test", async () => obj);

      mockFetch2(async (input: RequestInfo, init: RequestInit) => {
         expect(input).toBe(`${baseUrl}/test`);
         return new Response(JSON.stringify(obj), { status: 200 });
      });
      const response = await endpoint.$request({}, baseUrl);

      expect(response).toEqual({
         status: 200,
         ok: true,
         response: obj
      });
      unmockFetch();
   });

   it("resolves helper functions", async () => {
      const params = ["/test", () => ({ hello: "test" })];

      ["get", "post", "patch", "put", "delete"].forEach((method) => {
         const endpoint = Endpoint[method](...params);
         expect(endpoint.method).toBe(method.toUpperCase());
         expect(endpoint.path).toBe(params[0]);
      });
   });
});
