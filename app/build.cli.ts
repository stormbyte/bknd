import pkg from "./package.json" with { type: "json" };
import c from "picocolors";
import { formatNumber } from "bknd/utils";
import * as esbuild from "esbuild";

if (process.env.DEBUG) {
   await esbuild.build({
      entryPoints: ["./src/cli/index.ts"],
      outdir: "./dist/cli",
      platform: "node",
      minify: false,
      format: "esm",
      bundle: true,
      external: ["jsonv-ts", "jsonv-ts/*"],
      define: {
         __isDev: "0",
         __version: JSON.stringify(pkg.version),
      },
   });
   process.exit(0);
}

const result = await Bun.build({
   entrypoints: ["./src/cli/index.ts"],
   target: "node",
   outdir: "./dist/cli",
   env: "PUBLIC_*",
   minify: true,
   external: ["jsonv-ts", "jsonv-ts/*"],
   define: {
      __isDev: "0",
      __version: JSON.stringify(pkg.version),
   },
});

for (const output of result.outputs) {
   const size_ = await output.text();
   console.info(
      c.cyan(formatNumber.fileSize(size_.length)),
      c.dim(output.path.replace(import.meta.dir + "/", "")),
   );
}
