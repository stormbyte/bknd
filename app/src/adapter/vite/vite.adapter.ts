import { serveStatic } from "@hono/node-server/serve-static";
import { type DevServerOptions, default as honoViteDevServer } from "@hono/vite-dev-server";
import { type RuntimeBkndConfig, createRuntimeApp } from "adapter";
import type { App } from "bknd";

export type ViteBkndConfig<Env = any> = RuntimeBkndConfig<Env> & {
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
</head>`
   );
}

async function createApp(config: ViteBkndConfig = {}, env?: any) {
   return await createRuntimeApp(
      {
         ...config,
         adminOptions:
            config.setAdminHtml === false
               ? undefined
               : {
                    html: config.html,
                    forceDev: config.forceDev ?? {
                       mainPath: "/src/main.tsx"
                    }
                 },
         serveStatic: ["/assets/*", serveStatic({ root: config.distPath ?? "./" })]
      },
      env
   );
}

export function serveFresh(config: ViteBkndConfig = {}) {
   return {
      async fetch(request: Request, env: any, ctx: ExecutionContext) {
         const app = await createApp(config, env);
         return app.fetch(request, env, ctx);
      }
   };
}

let app: App;
export function serveCached(config: ViteBkndConfig = {}) {
   return {
      async fetch(request: Request, env: any, ctx: ExecutionContext) {
         if (!app) {
            app = await createApp(config, env);
         }

         return app.fetch(request, env, ctx);
      }
   };
}

export function devServer(options: DevServerOptions) {
   return honoViteDevServer({
      entry: "./server.ts",
      exclude: [
         /.*\.tsx?($|\?)/,
         /^(?!.*\/__admin).*\.(s?css|less)($|\?)/,
         // exclude except /api
         /^(?!.*\/api).*\.(ico|mp4|jpg|jpeg|svg|png|vtt|mp3|js)($|\?)/,
         /^\/@.+$/,
         /\/components.*?\.json.*/, // @todo: improve
         /^\/(public|assets|static)\/.+/,
         /^\/node_modules\/.*/
      ],
      injectClientScript: false,
      ...options
   });
}
