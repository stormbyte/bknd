import process from "node:process";
import { $ } from "bun";
import * as esbuild from "esbuild";
import type { BuildOptions } from "esbuild";

const isDev = process.env.NODE_ENV !== "production";

const metafile = true;
const sourcemap = false;

const config: BuildOptions = {
   entryPoints: ["worker.ts"],
   bundle: true,
   format: "esm",
   external: ["__STATIC_CONTENT_MANIFEST", "@xyflow/react"],
   platform: "browser",
   conditions: ["worker", "browser"],
   target: "es2022",
   sourcemap,
   metafile,
   minify: !isDev,
   loader: {
      ".html": "copy"
   },
   outfile: "dist/worker.js"
};

const dist = config.outfile!.split("/")[0];
if (!isDev) {
   await $`rm -rf ${dist}`;
}

const result = await esbuild.build(config);

if (result.metafile) {
   console.log("writing metafile to", `${dist}/meta.json`);
   await Bun.write(`${dist}/meta.json`, JSON.stringify(result.metafile!));
}

if (!isDev) {
   await $`gzip ${dist}/worker.js -c > ${dist}/worker.js.gz`;
}
