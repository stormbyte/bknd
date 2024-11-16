/**
 * CacheItem defines an interface for interacting with objects inside a cache.
 * based on https://www.php-fig.org/psr/psr-6/
 */
export interface ICacheItem<Data = any> {
   /**
    * Returns the key for the current cache item.
    *
    * The key is loaded by the Implementing Library, but should be available to
    * the higher level callers when needed.
    *
    * @returns The key string for this cache item.
    */
   key(): string;

   /**
    * Retrieves the value of the item from the cache associated with this object's key.
    *
    * The value returned must be identical to the value originally stored by set().
    *
    * If isHit() returns false, this method MUST return null. Note that null
    * is a legitimate cached value, so the isHit() method SHOULD be used to
    * differentiate between "null value was found" and "no value was found."
    *
    * @returns The value corresponding to this cache item's key, or undefined if not found.
    */
   value(): Data | undefined;

   /**
    * Retrieves the metadata of the item from the cache associated with this object's key.
    */
   metadata(): Record<string, string>;

   /**
    * Confirms if the cache item lookup resulted in a cache hit.
    *
    * Note: This method MUST NOT have a race condition between calling isHit()
    * and calling get().
    *
    * @returns True if the request resulted in a cache hit. False otherwise.
    */
   hit(): boolean;

   /**
    * Sets the value represented by this cache item.
    *
    * The value argument may be any item that can be serialized by PHP,
    * although the method of serialization is left up to the Implementing
    * Library.
    *
    * @param value The serializable value to be stored.
    * @param metadata The metadata to be associated with the item.
    * @returns The invoked object.
    */
   set(value: Data, metadata?: Record<string, string>): this;

   /**
    * Sets the expiration time for this cache item.
    *
    * @param expiration The point in time after which the item MUST be considered expired.
    *                   If null is passed explicitly, a default value MAY be used. If none is set,
    *                   the value should be stored permanently or for as long as the
    *                   implementation allows.
    * @returns The called object.
    */
   expiresAt(expiration: Date | null): this;

   /**
    * Sets the expiration time for this cache item.
    *
    * @param time The period of time from the present after which the item MUST be considered
    *             expired. An integer parameter is understood to be the time in seconds until
    *             expiration. If null is passed explicitly, a default value MAY be used.
    *             If none is set, the value should be stored permanently or for as long as the
    *             implementation allows.
    * @returns The called object.
    */
   expiresAfter(time: number | null): this;
}

/**
 * CachePool generates CacheItem objects.
 * based on https://www.php-fig.org/psr/psr-6/
 */
export interface ICachePool<Data = any> {
   supports(): {
      metadata: boolean;
      clear: boolean;
   };

   /**
    * Returns a Cache Item representing the specified key.
    * This method must always return a CacheItemInterface object, even in case of
    * a cache miss. It MUST NOT return null.
    *
    * @param key The key for which to return the corresponding Cache Item.
    * @throws Error If the key string is not a legal value an Error MUST be thrown.
    * @returns The corresponding Cache Item.
    */
   get(key: string): Promise<ICacheItem<Data>>;

   /**
    * Returns a traversable set of cache items.
    *
    * @param keys An indexed array of keys of items to retrieve.
    * @throws Error If any of the keys in keys are not a legal value an Error MUST be thrown.
    * @returns A traversable collection of Cache Items keyed by the cache keys of
    *          each item. A Cache item will be returned for each key, even if that
    *          key is not found. However, if no keys are specified then an empty
    *          traversable MUST be returned instead.
    */
   getMany(keys?: string[]): Promise<Map<string, ICacheItem<Data>>>;

   /**
    * Confirms if the cache contains specified cache item.
    *
    * Note: This method MAY avoid retrieving the cached value for performance reasons.
    * This could result in a race condition with CacheItemInterface.get(). To avoid
    * such situation use CacheItemInterface.isHit() instead.
    *
    * @param key The key for which to check existence.
    * @throws Error If the key string is not a legal value an Error MUST be thrown.
    * @returns True if item exists in the cache, false otherwise.
    */
   has(key: string): Promise<boolean>;

   /**
    * Deletes all items in the pool.
    * @returns True if the pool was successfully cleared. False if there was an error.
    */
   clear(): Promise<boolean>;

   /**
    * Removes the item from the pool.
    *
    * @param key The key to delete.
    * @throws Error If the key string is not a legal value an Error MUST be thrown.
    * @returns True if the item was successfully removed. False if there was an error.
    */
   delete(key: string): Promise<boolean>;

   /**
    * Removes multiple items from the pool.
    *
    * @param keys An array of keys that should be removed from the pool.
    * @throws Error If any of the keys in keys are not a legal value an Error MUST be thrown.
    * @returns True if the items were successfully removed. False if there was an error.
    */
   deleteMany(keys: string[]): Promise<boolean>;

   /**
    * Persists a cache item immediately.
    *
    * @param item The cache item to save.
    * @returns True if the item was successfully persisted. False if there was an error.
    */
   save(item: ICacheItem<Data>): Promise<boolean>;

   /**
    * Persists any deferred cache items.
    * @returns True if all not-yet-saved items were successfully saved or there were none. False otherwise.
    */
   put(
      key: string,
      value: any,
      options?: { expiresAt?: Date; metadata?: Record<string, string> },
   ): Promise<boolean>;
   put(
      key: string,
      value: any,
      options?: { ttl?: number; metadata?: Record<string, string> },
   ): Promise<boolean>;
   put(
      key: string,
      value: any,
      options?: ({ ttl?: number } | { expiresAt?: Date }) & { metadata?: Record<string, string> },
   ): Promise<boolean>;
}
