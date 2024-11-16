//import { beforeEach as bunBeforeEach, expect as bunExpect, test as bunTest } from "bun:test";
import type { ICacheItem, ICachePool } from "../../../src/core/cache/cache-interface";

export type TestOptions = {
   createCache: () => Promise<ICachePool>;
   createItem: (key: string, value: any) => ICacheItem;
   tester: {
      test: (name: string, fn: () => Promise<void>) => void;
      beforeEach: (fn: () => Promise<void>) => void;
      expect: (actual?: any) => {
         toBe(expected: any): void;
         toEqual(expected: any): void;
         toBeUndefined(): void;
      };
   };
};

export function runTests({ createCache, createItem, tester }: TestOptions) {
   let cache: ICachePool<string>;
   const { test, beforeEach, expect } = tester;

   beforeEach(async () => {
      cache = await createCache();
   });

   test("getItem returns correct item", async () => {
      const item = createItem("key1", "value1");
      await cache.save(item);
      const retrievedItem = await cache.get("key1");
      expect(retrievedItem.value()).toEqual(item.value());
   });

   test("getItem returns new item when key does not exist", async () => {
      const retrievedItem = await cache.get("key1");
      expect(retrievedItem.key()).toEqual("key1");
      expect(retrievedItem.value()).toBeUndefined();
   });

   test("getItems returns correct items", async () => {
      const item1 = createItem("key1", "value1");
      const item2 = createItem("key2", "value2");
      await cache.save(item1);
      await cache.save(item2);
      const retrievedItems = await cache.getMany(["key1", "key2"]);
      expect(retrievedItems.get("key1")?.value()).toEqual(item1.value());
      expect(retrievedItems.get("key2")?.value()).toEqual(item2.value());
   });

   test("hasItem returns true when item exists and is a hit", async () => {
      const item = createItem("key1", "value1");
      await cache.save(item);
      expect(await cache.has("key1")).toBe(true);
   });

   test("clear and deleteItem correctly clear the cache and delete items", async () => {
      const item = createItem("key1", "value1");
      await cache.save(item);

      if (cache.supports().clear) {
         await cache.clear();
      } else {
         await cache.delete("key1");
      }

      expect(await cache.has("key1")).toBe(false);
   });

   test("save correctly saves items to the cache", async () => {
      const item = createItem("key1", "value1");
      await cache.save(item);
      expect(await cache.has("key1")).toBe(true);
   });

   test("putItem correctly puts items in the cache ", async () => {
      await cache.put("key1", "value1", { ttl: 60 });
      const item = await cache.get("key1");
      expect(item.value()).toEqual("value1");
      expect(item.hit()).toBe(true);
   });

   /*test("commit returns true", async () => {
      expect(await cache.commit()).toBe(true);
   });*/
}
