import * as assert from "node:assert/strict";
import { createWriteStream } from "node:fs";
import { after, beforeEach, describe, test } from "node:test";
import { Miniflare } from "miniflare";
import {
   CloudflareKVCacheItem,
   CloudflareKVCachePool
} from "../../../src/core/cache/adapters/CloudflareKvCache";
import { runTests } from "./cache-test-suite";

// https://github.com/nodejs/node/issues/44372#issuecomment-1736530480
console.log = async (message: any) => {
   const tty = createWriteStream("/dev/tty");
   const msg = typeof message === "string" ? message : JSON.stringify(message, null, 2);
   return tty.write(`${msg}\n`);
};

describe("CloudflareKv", async () => {
   let mf: Miniflare;
   runTests({
      createCache: async () => {
         if (mf) {
            await mf.dispose();
         }

         mf = new Miniflare({
            modules: true,
            script: "export default { async fetch() { return new Response(null); } }",
            kvNamespaces: ["TEST"]
         });
         const kv = await mf.getKVNamespace("TEST");
         return new CloudflareKVCachePool(kv as any);
      },
      createItem: (key, value) => new CloudflareKVCacheItem(key, value),
      tester: {
         test,
         beforeEach,
         expect: (actual?: any) => {
            return {
               toBe(expected: any) {
                  assert.equal(actual, expected);
               },
               toEqual(expected: any) {
                  assert.deepEqual(actual, expected);
               },
               toBeUndefined() {
                  assert.equal(actual, undefined);
               }
            };
         }
      }
   });

   after(async () => {
      await mf?.dispose();
   });
});
