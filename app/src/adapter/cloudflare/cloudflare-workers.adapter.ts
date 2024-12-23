import { Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";
import type { BkndConfig } from "../index";
import { getCached } from "./modes/cached";
import { getDurable } from "./modes/durable";
import { getFresh, getWarm } from "./modes/fresh";

export type Context = {
   request: Request;
   env: any;
   ctx: ExecutionContext;
   manifest: any;
   html?: string;
};

export function serve(_config: BkndConfig, manifest?: string, html?: string) {
   return {
      async fetch(request: Request, env: any, ctx: ExecutionContext) {
         const url = new URL(request.url);

         if (manifest) {
            const pathname = url.pathname.slice(1);
            const assetManifest = JSON.parse(manifest);
            if (pathname && pathname in assetManifest) {
               const hono = new Hono();

               hono.all("*", async (c, next) => {
                  const res = await serveStatic({
                     path: `./${pathname}`,
                     manifest,
                     onNotFound: (path) => console.log("not found", path)
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

         const config = {
            ..._config,
            setAdminHtml: _config.setAdminHtml ?? !!manifest
         };
         const context = { request, env, ctx, manifest, html } as Context;
         const mode = config.cloudflare?.mode ?? "warm";

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
