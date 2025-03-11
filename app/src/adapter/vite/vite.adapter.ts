import { serveStatic } from "@hono/node-server/serve-static";
import { type DevServerOptions, default as honoViteDevServer } from "@hono/vite-dev-server";
import type { App } from "bknd";
import { type RuntimeBkndConfig, createRuntimeApp } from "bknd/adapter";
import { registerLocalMediaAdapter } from "bknd/adapter/node";
import { devServerConfig } from "./dev-server-config";

export type ViteBkndConfig<Env = any> = RuntimeBkndConfig<Env> & {
   mode?: "cached" | "fresh";
   setAdminHtml?: boolean;
   forceDev?: boolean | { mainPath: string };
   html?: string;
};

export function addViteScript(html: string, addBkndContext: boolean = true) {
   return html.replace(
      "</head>",
      `<script type="module">
import RefreshRuntime from "/@react-refresh"
RefreshRuntime.injectIntoGlobalHook(window)
window.$RefreshReg$ = () => {}
window.$RefreshSig$ = () => (type) => type
window.__vite_plugin_react_preamble_installed__ = true
</script>
<script type="module" src="/@vite/client"></script>
${addBkndContext ? "<!-- BKND_CONTEXT -->" : ""}
</head>`,
   );
}

async function createApp(config: ViteBkndConfig = {}, env?: any) {
   registerLocalMediaAdapter();
   return await createRuntimeApp(
      {
         ...config,
         adminOptions:
            config.setAdminHtml === false
               ? undefined
               : {
                    html: config.html,
                    forceDev: config.forceDev ?? {
                       mainPath: "/src/main.tsx",
                    },
                 },
         serveStatic: ["/assets/*", serveStatic({ root: config.distPath ?? "./" })],
      },
      env,
   );
}

export function serveFresh(config: Omit<ViteBkndConfig, "mode"> = {}) {
   return {
      async fetch(request: Request, env: any, ctx: ExecutionContext) {
         const app = await createApp(config, env);
         return app.fetch(request, env, ctx);
      },
   };
}

let app: App;
export function serveCached(config: Omit<ViteBkndConfig, "mode"> = {}) {
   return {
      async fetch(request: Request, env: any, ctx: ExecutionContext) {
         if (!app) {
            app = await createApp(config, env);
         }

         return app.fetch(request, env, ctx);
      },
   };
}

export function serve({ mode, ...config }: ViteBkndConfig = {}) {
   return mode === "fresh" ? serveFresh(config) : serveCached(config);
}

export function devServer(options: DevServerOptions) {
   return honoViteDevServer({
      ...devServerConfig,
      ...options,
   });
}
