import type { IncomingMessage } from "node:http";
import { type App, type CreateAppConfig, registries } from "bknd";
import { StorageLocalAdapter } from "media/storage/adapters/StorageLocalAdapter";

export type CloudflareBkndConfig<Env = any> = {
   mode?: "warm" | "fresh" | "cache" | "durable";
   bindings?: (env: Env) => {
      kv?: KVNamespace;
      dobj?: DurableObjectNamespace;
   };
   key?: string;
   keepAliveSeconds?: number;
   forceHttps?: boolean;
};

// @todo: move to App
export type BkndConfig<Env = any> = {
   app: CreateAppConfig | ((env: Env) => CreateAppConfig);
   setAdminHtml?: boolean;
   server?: {
      port?: number;
      platform?: "node" | "bun";
   };
   cloudflare?: CloudflareBkndConfig<Env>;
   onBuilt?: (app: App) => Promise<void>;
};

export function nodeRequestToRequest(req: IncomingMessage): Request {
   let protocol = "http";
   try {
      protocol = req.headers["x-forwarded-proto"] as string;
   } catch (e) {}
   const host = req.headers.host;
   const url = `${protocol}://${host}${req.url}`;
   const headers = new Headers();

   for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) {
         headers.append(key, value.join(", "));
      } else if (value) {
         headers.append(key, value);
      }
   }

   const method = req.method || "GET";
   return new Request(url, {
      method,
      headers
   });
}

export function registerLocalMediaAdapter() {
   registries.media.register("local", StorageLocalAdapter);
}
