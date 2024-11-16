import { beforeEach, describe, expect, test } from "bun:test";
import { MemoryCache, MemoryCacheItem } from "../../../src/core/cache/adapters/MemoryCache";
import { runTests } from "./cache-test-suite";

describe("MemoryCache", () => {
   runTests({
      createCache: async () => new MemoryCache(),
      createItem: (key, value) => new MemoryCacheItem(key, value),
      tester: {
         test,
         beforeEach,
         expect
      }
   });
});
