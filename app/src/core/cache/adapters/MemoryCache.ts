import type { ICacheItem, ICachePool } from "../cache-interface";

export class MemoryCache<Data = any> implements ICachePool<Data> {
   private cache: Map<string, MemoryCacheItem<Data>> = new Map();
   private maxSize?: number;

   constructor(options?: { maxSize?: number }) {
      this.maxSize = options?.maxSize;
   }

   supports = () => ({
      metadata: true,
      clear: true
   });

   async get(key: string): Promise<MemoryCacheItem<Data>> {
      if (!this.cache.has(key)) {
         // use undefined to denote a miss initially
         return new MemoryCacheItem<Data>(key, undefined!);
      }
      return this.cache.get(key)!;
   }

   async getMany(keys: string[] = []): Promise<Map<string, MemoryCacheItem<Data>>> {
      const items = new Map<string, MemoryCacheItem<Data>>();
      for (const key of keys) {
         items.set(key, await this.get(key));
      }
      return items;
   }

   async has(key: string): Promise<boolean> {
      return this.cache.has(key) && this.cache.get(key)!.hit();
   }

   async clear(): Promise<boolean> {
      this.cache.clear();
      return true;
   }

   async delete(key: string): Promise<boolean> {
      return this.cache.delete(key);
   }

   async deleteMany(keys: string[]): Promise<boolean> {
      let success = true;
      for (const key of keys) {
         if (!this.delete(key)) {
            success = false;
         }
      }
      return success;
   }

   async save(item: MemoryCacheItem<Data>): Promise<boolean> {
      this.checkSizeAndPurge();
      this.cache.set(item.key(), item);
      return true;
   }

   async put(
      key: string,
      value: Data,
      options: { expiresAt?: Date; ttl?: number; metadata?: Record<string, string> } = {}
   ): Promise<boolean> {
      const item = await this.get(key);
      item.set(value, options.metadata || {});
      if (options.expiresAt) {
         item.expiresAt(options.expiresAt);
      } else if (typeof options.ttl === "number") {
         item.expiresAfter(options.ttl);
      }
      return this.save(item);
   }

   private checkSizeAndPurge(): void {
      if (!this.maxSize) return;

      if (this.cache.size >= this.maxSize) {
         // Implement logic to purge items, e.g., LRU (Least Recently Used)
         // For simplicity, clear the oldest item inserted
         const keyToDelete = this.cache.keys().next().value;
         this.cache.delete(keyToDelete!);
      }
   }
}

export class MemoryCacheItem<Data = any> implements ICacheItem<Data> {
   private _key: string;
   private _value: Data | undefined;
   private expiration: Date | null = null;
   private _metadata: Record<string, string> = {};

   constructor(key: string, value: Data, metadata: Record<string, string> = {}) {
      this._key = key;
      this.set(value, metadata);
   }

   key(): string {
      return this._key;
   }

   metadata(): Record<string, string> {
      return this._metadata;
   }

   value(): Data | undefined {
      return this._value;
   }

   hit(): boolean {
      if (this.expiration !== null && new Date() > this.expiration) {
         return false;
      }
      return this.value() !== undefined;
   }

   set(value: Data, metadata: Record<string, string> = {}): this {
      this._value = value;
      this._metadata = metadata;
      return this;
   }

   expiresAt(expiration: Date | null): this {
      this.expiration = expiration;
      return this;
   }

   expiresAfter(time: number | null): this {
      if (typeof time === "number") {
         const expirationDate = new Date();
         expirationDate.setSeconds(expirationDate.getSeconds() + time);
         this.expiration = expirationDate;
      } else {
         this.expiration = null;
      }
      return this;
   }
}
