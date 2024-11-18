import { readFile } from "node:fs/promises";
import { serveStatic } from "@hono/node-server/serve-static";
import type { BkndConfig } from "bknd";
import { App } from "../../App";

async function getHtml() {
   return readFile("index.html", "utf8");
}
function addViteScripts(html: string) {
   return html.replace(
      "<head>",
      `<script type="module">
import RefreshRuntime from "/@react-refresh"
RefreshRuntime.injectIntoGlobalHook(window)
window.$RefreshReg$ = () => {}
window.$RefreshSig$ = () => (type) => type
window.__vite_plugin_react_preamble_installed__ = true
</script>
<script type="module" src="/@vite/client"></script>
`
   );
}

function createApp(config: BkndConfig, env: any) {
   const create_config = typeof config.app === "function" ? config.app(env) : config.app;
   return App.create(create_config);
}

function setAppBuildListener(app: App, config: BkndConfig, html: string) {
   app.emgr.on(
      "app-built",
      async () => {
         await config.onBuilt?.(app);
         app.module.server.setAdminHtml(html);
         app.module.server.client.get("/assets/!*", serveStatic({ root: "./" }));
      },
      "sync"
   );
}

export async function serveFresh(config: BkndConfig, _html?: string) {
   let html = _html;
   if (!html) {
      html = await getHtml();
   }

   html = addViteScripts(html);

   return {
      async fetch(request: Request, env: any, ctx: ExecutionContext) {
         const app = createApp(config, env);

         setAppBuildListener(app, config, html);
         await app.build();

         //console.log("routes", app.module.server.client.routes);
         return app.fetch(request, env, ctx);
      }
   };
}

let app: App;
export async function serveCached(config: BkndConfig, _html?: string) {
   let html = _html;
   if (!html) {
      html = await getHtml();
   }

   html = addViteScripts(html);

   return {
      async fetch(request: Request, env: any, ctx: ExecutionContext) {
         if (!app) {
            app = createApp(config, env);
            setAppBuildListener(app, config, html);
            await app.build();
         }

         return app.fetch(request, env, ctx);
      }
   };
}
