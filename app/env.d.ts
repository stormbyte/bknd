/// <reference types="@cloudflare/workers-types" />
/// <reference types="vite/client" />
/// <reference lib="dom" />

import {} from "hono";
import type { App } from "./src/App";
import type { Env as AppEnv } from "./src/core/env";

declare module "__STATIC_CONTENT_MANIFEST" {
   const manifest: string;
   export default manifest;
}

type TURSO_DB = {
   url: string;
   authToken: string;
};
/*
// automatically add bindings everywhere (also when coming from controllers)
declare module "hono" {
   interface Env {
      // c.var types
      Variables: {
         app: App;
      };
      // c.env types
      Bindings: AppEnv;
   }
}*/

declare const __isDev: boolean;
declare global {
   /*interface Request {
      cf: IncomingRequestCfProperties;
   }*/

   type AppContext = {
      app: App;
   };

   type HonoEnv = {
      Variables: {
         app: App;
      };
      Bindings: AppEnv;
   };

   type Prettify<T> = {
      [K in keyof T]: T[K];
   } & NonNullable<unknown>;

   // prettify recursively
   type PrettifyRec<T> = {
      [K in keyof T]: T[K] extends object ? Prettify<T[K]> : T[K];
   } & NonNullable<unknown>;
}
