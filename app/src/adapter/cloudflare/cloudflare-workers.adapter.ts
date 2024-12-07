import { DurableObject } from "cloudflare:workers";
import { App, type CreateAppConfig } from "bknd";
import { Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";
import type { BkndConfig, CfBkndModeCache } from "../index";

type Context = {
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
                     const ttl = pathname.startsWith("assets/")
                        ? 60 * 60 * 24 * 365 // 1 year
                        : 60 * 5; // 5 minutes
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
         const context = { request, env, ctx, manifest, html };
         const mode = config.cloudflare?.mode?.(env);

         if (!mode) {
            console.log("serving fresh...");
            const app = await getFresh(config, context);
            return app.fetch(request, env);
         } else if ("cache" in mode) {
            console.log("serving cached...");
            const app = await getCached(config as any, context);
            return app.fetch(request, env);
         } else if ("durableObject" in mode) {
            console.log("serving durable...");

            if (config.onBuilt) {
               console.log("onBuilt() is not supported with DurableObject mode");
            }

            const start = performance.now();

            const durable = mode.durableObject;
            const id = durable.idFromName(mode.key);
            const stub = durable.get(id) as unknown as DurableBkndApp;

            const create_config = typeof config.app === "function" ? config.app(env) : config.app;

            const res = await stub.fire(request, {
               config: create_config,
               html,
               keepAliveSeconds: mode.keepAliveSeconds,
               setAdminHtml: config.setAdminHtml
            });

            const headers = new Headers(res.headers);
            headers.set("X-TTDO", String(performance.now() - start));

            return new Response(res.body, {
               status: res.status,
               statusText: res.statusText,
               headers
            });
         }
      }
   };
}

async function getFresh(config: BkndConfig, { env, html }: Context) {
   const create_config = typeof config.app === "function" ? config.app(env) : config.app;
   const app = App.create(create_config);

   if (config.onBuilt) {
      app.emgr.onEvent(
         App.Events.AppBuiltEvent,
         async ({ params: { app } }) => {
            config.onBuilt!(app);
         },
         "sync"
      );
   }
   await app.build();

   if (config.setAdminHtml) {
      app.registerAdminController({ html });
   }

   return app;
}

async function getCached(
   config: BkndConfig & { cloudflare: { mode: CfBkndModeCache } },
   { env, html, ctx }: Context
) {
   const { cache, key } = config.cloudflare.mode(env) as ReturnType<CfBkndModeCache>;
   const create_config = typeof config.app === "function" ? config.app(env) : config.app;

   const cachedConfig = await cache.get(key);
   const initialConfig = cachedConfig ? JSON.parse(cachedConfig) : undefined;

   const app = App.create({ ...create_config, initialConfig });

   async function saveConfig(__config: any) {
      ctx.waitUntil(cache.put(key, JSON.stringify(__config)));
   }

   if (config.onBuilt) {
      app.emgr.onEvent(
         App.Events.AppBuiltEvent,
         async ({ params: { app } }) => {
            app.module.server.client.get("/__bknd/cache", async (c) => {
               await cache.delete(key);
               return c.json({ message: "Cache cleared" });
            });
            app.registerAdminController({ html });

            config.onBuilt!(app);
         },
         "sync"
      );
   }

   app.emgr.onEvent(
      App.Events.AppConfigUpdatedEvent,
      async ({ params: { app } }) => {
         saveConfig(app.toJSON(true));
      },
      "sync"
   );

   await app.build();

   if (config.setAdminHtml) {
      app.registerAdminController({ html });
   }

   if (!cachedConfig) {
      saveConfig(app.toJSON(true));
   }

   return app;
}

export class DurableBkndApp extends DurableObject {
   protected id = Math.random().toString(36).slice(2);
   protected app?: App;
   protected interval?: any;

   async fire(
      request: Request,
      options: {
         config: CreateAppConfig;
         html?: string;
         keepAliveSeconds?: number;
         setAdminHtml?: boolean;
      }
   ) {
      let buildtime = 0;
      if (!this.app) {
         const start = performance.now();
         const config = options.config;

         // change protocol to websocket if libsql
         if (
            config?.connection &&
            "type" in config.connection &&
            config.connection.type === "libsql"
         ) {
            config.connection.config.protocol = "wss";
         }

         this.app = App.create(config);
         this.app.emgr.onEvent(
            App.Events.AppBuiltEvent,
            async ({ params: { app } }) => {
               app.modules.server.get("/__do", async (c) => {
                  // @ts-ignore
                  const context: any = c.req.raw.cf ? c.req.raw.cf : c.env.cf;
                  return c.json({
                     id: this.id,
                     keepAlive: options?.keepAliveSeconds,
                     colo: context.colo
                  });
               });
            },
            "sync"
         );

         await this.app.build();

         buildtime = performance.now() - start;
      }

      if (options?.keepAliveSeconds) {
         this.keepAlive(options.keepAliveSeconds);
      }

      console.log("id", this.id);
      const res = await this.app!.fetch(request);
      const headers = new Headers(res.headers);
      headers.set("X-BuildTime", buildtime.toString());
      headers.set("X-DO-ID", this.id);

      return new Response(res.body, {
         status: res.status,
         statusText: res.statusText,
         headers
      });
   }

   protected keepAlive(seconds: number) {
      console.log("keep alive for", seconds);
      if (this.interval) {
         console.log("clearing, there is a new");
         clearInterval(this.interval);
      }

      let i = 0;
      this.interval = setInterval(() => {
         i += 1;
         //console.log("keep-alive", i);
         if (i === seconds) {
            console.log("cleared");
            clearInterval(this.interval);

            // ping every 30 seconds
         } else if (i % 30 === 0) {
            console.log("ping");
            this.app?.modules.ctx().connection.ping();
         }
      }, 1000);
   }
}
