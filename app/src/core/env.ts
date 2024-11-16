type TURSO_DB = {
   url: string;
   authToken: string;
};

export type Env = {
   __STATIC_CONTENT: Fetcher;
   ENVIRONMENT: string;
   CACHE: KVNamespace;

   // db
   DB_DATA: TURSO_DB;
   DB_SCHEMA: TURSO_DB;

   // storage
   STORAGE: { access_key: string; secret_access_key: string; url: string };
   BUCKET: R2Bucket;
};

export function isDebug(): boolean {
   try {
      // @ts-expect-error - this is a global variable in dev
      return __isDev === "1" || __isDev === 1;
   } catch (e) {
      return false;
   }
}
