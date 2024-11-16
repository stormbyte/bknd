import type { ICacheItem, ICachePool } from "../cache-interface";

export class CloudflareKVCachePool<Data = any> implements ICachePool<Data> {
   constructor(private namespace: KVNamespace) {}

   supports = () => ({
      metadata: true,
      clear: false,
   });

   async get(key: string): Promise<ICacheItem<Data>> {
      const result = await this.namespace.getWithMetadata<any>(key);
      const hit = result.value !== null && typeof result.value !== "undefined";
      // Assuming metadata is not supported directly;
      // you may adjust if Cloudflare KV supports it in future.
      return new CloudflareKVCacheItem(key, result.value ?? undefined, hit, result.metadata) as any;
   }

   async getMany(keys: string[] = []): Promise<Map<string, ICacheItem<Data>>> {
      const items = new Map<string, ICacheItem<Data>>();
      await Promise.all(
         keys.map(async (key) => {
            const item = await this.get(key);
            items.set(key, item);
         }),
      );
      return items;
   }

   async has(key: string): Promise<boolean> {
      const data = await this.namespace.get(key);
      return data !== null;
   }

   async clear(): Promise<boolean> {
      // Cloudflare KV does not support clearing all keys in one operation
      return false;
   }

   async delete(key: string): Promise<boolean> {
      await this.namespace.delete(key);
      return true;
   }

   async deleteMany(keys: string[]): Promise<boolean> {
      const results = await Promise.all(keys.map((key) => this.delete(key)));
      return results.every((result) => result);
   }

   async save(item: CloudflareKVCacheItem<Data>): Promise<boolean> {
      await this.namespace.put(item.key(), (await item.value()) as string, {
         expirationTtl: item._expirationTtl,
         metadata: item.metadata(),
      });

      return true;
   }

   async put(
      key: string,
      value: any,
      options?: { ttl?: number; expiresAt?: Date; metadata?: Record<string, string> },
   ): Promise<boolean> {
      const item = new CloudflareKVCacheItem(key, value, true, options?.metadata);

      if (options?.expiresAt) item.expiresAt(options.expiresAt);
      if (options?.ttl) item.expiresAfter(options.ttl);

      return await this.save(item);
   }
}

export class CloudflareKVCacheItem<Data = any> implements ICacheItem<Data> {
   _expirationTtl: number | undefined;

   constructor(
      private _key: string,
      private data: Data | undefined,
      private _hit: boolean = false,
      private _metadata: Record<string, string> = {},
   ) {}

   key(): string {
      return this._key;
   }

   value(): Data | undefined {
      if (this.data) {
         try {
            return JSON.parse(this.data as string);
         } catch (e) {}
      }

      return this.data ?? undefined;
   }

   metadata(): Record<string, string> {
      return this._metadata;
   }

   hit(): boolean {
      return this._hit;
   }

   set(value: Data, metadata: Record<string, string> = {}): this {
      this.data = value;
      this._metadata = metadata;
      return this;
   }

   expiresAt(expiration: Date | null): this {
      // Cloudflare KV does not support specific date expiration; calculate ttl instead.
      if (expiration) {
         const now = new Date();
         const ttl = (expiration.getTime() - now.getTime()) / 1000;
         return this.expiresAfter(Math.max(0, Math.floor(ttl)));
      }
      return this.expiresAfter(null);
   }

   expiresAfter(time: number | null): this {
      // Dummy implementation as Cloudflare KV requires setting expiration during PUT operation.
      // This method will be effectively implemented in the Cache Pool save methods.
      this._expirationTtl = time ?? undefined;
      return this;
   }
}
