import { describe, expect, test } from "bun:test";
import { Perf } from "../../src/core/utils";
import * as reqres from "../../src/core/utils/reqres";
import * as strings from "../../src/core/utils/strings";

async function wait(ms: number) {
   return new Promise((resolve) => {
      setTimeout(resolve, ms);
   });
}

describe("Core Utils", async () => {
   describe("[core] strings", async () => {
      test("objectToKeyValueArray", async () => {
         const obj = { a: 1, b: 2, c: 3 };
         const result = strings.objectToKeyValueArray(obj);
         expect(result).toEqual([
            { key: "a", value: 1 },
            { key: "b", value: 2 },
            { key: "c", value: 3 }
         ]);
      });

      test("snakeToPascalWithSpaces", async () => {
         const result = strings.snakeToPascalWithSpaces("snake_to_pascal");
         expect(result).toBe("Snake To Pascal");
      });

      test("randomString", async () => {
         const result = strings.randomString(10);
         expect(result).toHaveLength(10);
      });

      test("pascalToKebab", async () => {
         const result = strings.pascalToKebab("PascalCase");
         expect(result).toBe("pascal-case");
      });

      test("replaceSimplePlaceholders", async () => {
         const str = "Hello, {$name}!";
         const vars = { name: "John" };
         const result = strings.replaceSimplePlaceholders(str, vars);
         expect(result).toBe("Hello, John!");
      });
   });

   describe("reqres", async () => {
      test("headersToObject", () => {
         const headers = new Headers();
         headers.append("Content-Type", "application/json");
         headers.append("Authorization", "Bearer 123");
         const obj = reqres.headersToObject(headers);
         expect(obj).toEqual({
            "content-type": "application/json",
            authorization: "Bearer 123"
         });
      });

      test("replaceUrlParam", () => {
         const url = "/api/:id/:name";
         const params = { id: "123", name: "test" };
         const result = reqres.replaceUrlParam(url, params);
         expect(result).toBe("/api/123/test");
      });

      test("encode", () => {
         const obj = { id: "123", name: "test" };
         const result = reqres.encodeSearch(obj);
         expect(result).toBe("id=123&name=test");

         const obj2 = { id: "123", name: ["test1", "test2"] };
         const result2 = reqres.encodeSearch(obj2);
         expect(result2).toBe("id=123&name=test1&name=test2");

         const obj3 = { id: "123", name: { test: "test" } };
         const result3 = reqres.encodeSearch(obj3, { encode: true });
         expect(result3).toBe("id=123&name=%7B%22test%22%3A%22test%22%7D");
      });
   });

   describe("perf", async () => {
      test("marks", async () => {
         const perf = Perf.start();
         await wait(20);
         perf.mark("boot");

         await wait(10);
         perf.mark("another");
         perf.close();

         const perf2 = Perf.start();
         await wait(40);
         perf2.mark("booted");
         await wait(10);
         perf2.mark("what");
         perf2.close();

         expect(perf.result().total).toBeLessThan(perf2.result().total);
      });

      test("executes correctly", async () => {
         // write a test for "execute" method
         let count = 0;
         await Perf.execute(async () => {
            count += 1;
         }, 2);

         expect(count).toBe(2);
      });
   });
});
