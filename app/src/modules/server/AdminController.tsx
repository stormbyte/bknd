/** @jsxImportSource hono/jsx */

import type { App } from "App";
import { type ClassController, isDebug } from "core";
import { Hono } from "hono";
import { html, raw } from "hono/html";
import { Fragment } from "hono/jsx";
import * as SystemPermissions from "modules/permissions";
import type { Manifest } from "vite";

const viteInject = `
import RefreshRuntime from "/@react-refresh"
RefreshRuntime.injectIntoGlobalHook(window)
window.$RefreshReg$ = () => {}
window.$RefreshSig$ = () => (type) => type
window.__vite_plugin_react_preamble_installed__ = true
`;

export type AdminControllerOptions = {
   html?: string;
   viteManifest?: Manifest;
};

export class AdminController implements ClassController {
   constructor(
      private readonly app: App,
      private options: AdminControllerOptions = {}
   ) {}

   get ctx() {
      return this.app.modules.ctx();
   }

   getController(): Hono {
      const hono = new Hono();
      const configs = this.app.modules.configs();
      const basepath = (String(configs.server.admin.basepath) + "/").replace(/\/+$/, "/");

      this.ctx.server.get(basepath + "*", async (c) => {
         if (this.options.html) {
            return c.html(this.options.html);
         }

         // @todo: implement guard redirect once cookie sessions arrive

         const isProd = !isDebug();
         let script: string | undefined;
         let css: string[] = [];

         if (isProd) {
            const manifest: Manifest = this.options.viteManifest
               ? this.options.viteManifest
               : isProd
                 ? // @ts-ignore cases issues when building types
                   await import("bknd/dist/manifest.json", { assert: { type: "json" } }).then(
                      (m) => m.default
                   )
                 : {};
            //console.log("manifest", manifest, manifest["index.html"]);
            const entry = Object.values(manifest).find((f: any) => f.isEntry === true);
            if (!entry) {
               // do something smart
               return;
            }

            script = "/" + entry.file;
            css = entry.css?.map((c: string) => "/" + c) ?? [];
         }

         return c.html(
            <html lang="en" class={configs.server.admin.color_scheme ?? "light"}>
               <head>
                  <meta charset="UTF-8" />
                  <meta
                     name="viewport"
                     content="width=device-width, initial-scale=1, maximum-scale=1"
                  />
                  <title>BKND</title>
                  {isProd ? (
                     <Fragment>
                        <script type="module" CrossOrigin src={script} />
                        {css.map((c) => (
                           <link rel="stylesheet" CrossOrigin href={c} key={c} />
                        ))}
                     </Fragment>
                  ) : (
                     <Fragment>
                        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: I know what I do here :) */}
                        <script type="module" dangerouslySetInnerHTML={{ __html: viteInject }} />
                        <script type="module" src="/@vite/client" />
                     </Fragment>
                  )}
               </head>
               <body>
                  <div id="app" />
                  {!isProd && <script type="module" src="/src/ui/main.tsx" />}
               </body>
            </html>
         );
      });

      return hono;
   }
}
