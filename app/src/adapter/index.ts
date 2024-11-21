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
