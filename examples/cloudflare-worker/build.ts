import { $ } from "bun";
//import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";
import esbuild from "esbuild";

const result = await esbuild.build({
   //plugins: [NodeModulesPolyfillPlugin()],
   platform: "browser",
   conditions: ["worker", "browser"],
   entryPoints: ["./src/index.ts"],
   outdir: "dist",
   external: ["__STATIC_CONTENT_MANIFEST", "cloudflare:workers"],
   format: "esm",
   target: "es2022",
   keepNames: true,
   bundle: true,
   metafile: true,
   minify: true,
   loader: {
      ".html": "copy"
   },
   define: {
      IS_CLOUDFLARE_WORKER: "true"
   }
});

await Bun.write("dist/meta.json", JSON.stringify(result.metafile));
await $`gzip dist/index.js -c > dist/index.js.gz`;
