import type { CreateAppConfig } from "bknd";
import { Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";
import type { FrameworkBkndConfig } from "../index";
import { getCached } from "./modes/cached";
import { getDurable } from "./modes/durable";
import { getFresh, getWarm } from "./modes/fresh";

export type CloudflareBkndConfig<Env = any> = Omit<FrameworkBkndConfig, "app"> & {
   app: CreateAppConfig | ((env: Env) => CreateAppConfig);
   mode?: "warm" | "fresh" | "cache" | "durable";
   bindings?: (env: Env) => {
      kv?: KVNamespace;
      dobj?: DurableObjectNamespace;
   };
   key?: string;
   keepAliveSeconds?: number;
   forceHttps?: boolean;
   manifest?: string;
   setAdminHtml?: boolean;
   html?: string;
};

export type Context = {
   request: Request;
   env: any;
   ctx: ExecutionContext;
};

export function serve(config: CloudflareBkndConfig) {
   return {
      async fetch(request: Request, env: any, ctx: ExecutionContext) {
         const url = new URL(request.url);
         const manifest = config.manifest;

         if (manifest) {
            const pathname = url.pathname.slice(1);
            const assetManifest = JSON.parse(manifest);
            if (pathname && pathname in assetManifest) {
               const hono = new Hono();

               hono.all("*", async (c, next) => {
                  const res = await serveStatic({
                     path: `./${pathname}`,
                     manifest
                  })(c as any, next);
                  if (res instanceof Response) {
                     const ttl = 60 * 60 * 24 * 365;
                     res.headers.set("Cache-Control", `public, max-age=${ttl}`);
                     return res;
                  }

                  return c.notFound();
               });

               return hono.fetch(request, env);
            }
         }

         config.setAdminHtml = config.setAdminHtml && !!config.manifest;

         const context = { request, env, ctx } as Context;
         const mode = config.mode ?? "warm";

         switch (mode) {
            case "fresh":
               return await getFresh(config, context);
            case "warm":
               return await getWarm(config, context);
            case "cache":
               return await getCached(config, context);
            case "durable":
               return await getDurable(config, context);
            default:
               throw new Error(`Unknown mode ${mode}`);
         }
      }
   };
}
