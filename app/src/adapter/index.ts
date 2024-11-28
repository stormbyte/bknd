import type { IncomingMessage } from "node:http";
import type { App, CreateAppConfig } from "bknd";

export type CfBkndModeCache<Env = any> = (env: Env) => {
   cache: KVNamespace;
   key: string;
};

export type CfBkndModeDurableObject<Env = any> = (env: Env) => {
   durableObject: DurableObjectNamespace;
   key: string;
   keepAliveSeconds?: number;
};

export type CloudflareBkndConfig<Env = any> = {
   mode?: CfBkndModeCache | CfBkndModeDurableObject;
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

export type BkndConfigJson = {
   app: CreateAppConfig;
   setAdminHtml?: boolean;
   server?: {
      port?: number;
   };
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
