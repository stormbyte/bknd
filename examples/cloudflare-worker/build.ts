import { $ } from "bun";
//import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";
import esbuild from "esbuild";

const result = await esbuild.build({
   //plugins: [NodeModulesPolyfillPlugin()],
   platform: "browser",
   conditions: ["worker", "browser"],
   entryPoints: ["./src/index.ts"],
   outdir: "dist",
   external: [],
   format: "esm",
   target: "es2022",
   keepNames: true,
   bundle: true,
   metafile: true,
   minify: true,
   define: {
      IS_CLOUDFLARE_WORKER: "true"
   }
});

await Bun.write("dist/meta.json", JSON.stringify(result.metafile));
//console.log("result", result.metafile);
