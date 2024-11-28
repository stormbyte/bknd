import { $, type Subprocess } from "bun";
import * as esbuild from "esbuild";
import postcss from "esbuild-postcss";
import { entryOutputMeta } from "./internal/esbuild.entry-output-meta.plugin";
import { guessMimeType } from "./src/media/storage/mime-types";

const args = process.argv.slice(2);
const watch = args.includes("--watch");
const minify = args.includes("--minify");
const types = args.includes("--types");
const sourcemap = args.includes("--sourcemap");

type BuildOptions = esbuild.BuildOptions & { name: string };

const baseOptions: Partial<Omit<esbuild.BuildOptions, "plugins">> & { plugins?: any[] } = {
   minify,
   sourcemap,
   metafile: true,
   format: "esm",
   drop: ["console", "debugger"],
   loader: {
      ".svg": "dataurl"
   },
   define: {
      __isDev: "0"
   }
};

// @ts-ignore
type BuildFn = (format?: "esm" | "cjs") => BuildOptions;

// build BE
const builds: Record<string, BuildFn> = {
   backend: (format = "esm") => ({
      ...baseOptions,
      name: `backend ${format}`,
      entryPoints: [
         "src/index.ts",
         "src/data/index.ts",
         "src/core/index.ts",
         "src/core/utils/index.ts",
         "src/ui/index.ts",
         "src/ui/main.css"
      ],
      outdir: "dist",
      outExtension: { ".js": format === "esm" ? ".js" : ".cjs" },
      platform: "browser",
      splitting: false,
      bundle: true,
      plugins: [postcss()],
      //target: "es2022",
      format
   }),
   /*components: (format = "esm") => ({
      ...baseOptions,
      name: `components ${format}`,
      entryPoints: ["src/ui/index.ts", "src/ui/main.css"],
      outdir: "dist/ui",
      outExtension: { ".js": format === "esm" ? ".js" : ".cjs" },
      format,
      platform: "browser",
      splitting: false,
      //target: "es2022",
      bundle: true,
      //external: ["react", "react-dom", "@tanstack/react-query-devtools"],
      plugins: [postcss()],
      loader: {
         ".svg": "dataurl",
         ".js": "jsx"
      }
   }),*/
   static: (format = "esm") => ({
      ...baseOptions,
      name: `static ${format}`,
      entryPoints: ["src/ui/main.tsx", "src/ui/main.css"],
      entryNames: "[dir]/[name]-[hash]",
      outdir: "dist/static",
      outExtension: { ".js": format === "esm" ? ".js" : ".cjs" },
      platform: "browser",
      bundle: true,
      splitting: true,
      inject: ["src/ui/inject.js"],
      target: "es2022",
      format,
      loader: {
         ".svg": "dataurl",
         ".js": "jsx"
      },
      define: {
         __isDev: "0",
         "process.env.NODE_ENV": '"production"'
      },
      chunkNames: "chunks/[name]-[hash]",
      plugins: [
         postcss(),
         entryOutputMeta(async (info) => {
            const manifest: Record<string, object> = {};
            const toAsset = (output: string) => {
               const name = output.split("/").pop()!;
               return {
                  name,
                  path: output,
                  mime: guessMimeType(name)
               };
            };
            for (const { output, meta } of info) {
               manifest[meta.entryPoint as string] = toAsset(output);
               if (meta.cssBundle) {
                  manifest["src/ui/main.css"] = toAsset(meta.cssBundle);
               }
            }

            const manifest_file = "dist/static/manifest.json";
            await Bun.write(manifest_file, JSON.stringify(manifest, null, 2));
            console.log(`Manifest written to ${manifest_file}`, manifest);
         })
      ]
   })
};

function adapter(adapter: string, overrides: Partial<esbuild.BuildOptions> = {}): BuildOptions {
   return {
      ...baseOptions,
      name: `adapter ${adapter} ${overrides?.format === "cjs" ? "cjs" : "esm"}`,
      entryPoints: [`src/adapter/${adapter}`],
      platform: "neutral",
      outfile: `dist/adapter/${adapter}/index.${overrides?.format === "cjs" ? "cjs" : "js"}`,
      external: [
         "cloudflare:workers",
         "@hono*",
         "hono*",
         "bknd*",
         "*.html",
         "node*",
         "react*",
         "next*",
         "libsql",
         "@libsql*"
      ],
      splitting: false,
      treeShaking: true,
      bundle: true,
      ...overrides
   };
}
const adapters = [
   adapter("vite", { platform: "node" }),
   adapter("cloudflare"),
   adapter("nextjs", { platform: "node", format: "esm" }),
   adapter("nextjs", { platform: "node", format: "cjs" }),
   adapter("remix", { format: "esm" }),
   adapter("remix", { format: "cjs" }),
   adapter("bun"),
   adapter("node", { platform: "node", format: "esm" }),
   adapter("node", { platform: "node", format: "cjs" })
];

const collect = [
   builds.static(),
   builds.backend(),
   //builds.components(),
   builds.backend("cjs"),
   //builds.components("cjs"),
   ...adapters
];

if (watch) {
   const _state: {
      timeout: Timer | undefined;
      cleanup: Subprocess | undefined;
      building: Subprocess | undefined;
   } = {
      timeout: undefined,
      cleanup: undefined,
      building: undefined
   };

   async function rebuildTypes() {
      if (!types) return;
      if (_state.timeout) {
         clearTimeout(_state.timeout);
         if (_state.cleanup) _state.cleanup.kill();
         if (_state.building) _state.building.kill();
      }
      _state.timeout = setTimeout(async () => {
         _state.cleanup = Bun.spawn(["bun", "clean:types"], {
            onExit: () => {
               _state.cleanup = undefined;
               _state.building = Bun.spawn(["bun", "build:types"], {
                  onExit: () => {
                     _state.building = undefined;
                     console.log("Types rebuilt");
                  }
               });
            }
         });
      }, 1000);
   }

   for (const { name, ...build } of collect) {
      const ctx = await esbuild.context({
         ...build,
         plugins: [
            ...(build.plugins ?? []),
            {
               name: "rebuild-notify",
               setup(build) {
                  build.onEnd((result) => {
                     console.log(`rebuilt ${name} with ${result.errors.length} errors`);
                     rebuildTypes();
                  });
               }
            }
         ]
      });
      ctx.watch();
   }
} else {
   await $`rm -rf dist`;

   async function _build() {
      let i = 0;
      const count = collect.length;
      for await (const { name, ...build } of collect) {
         await esbuild.build({
            ...build,
            plugins: [
               ...(build.plugins || []),
               {
                  name: "progress",
                  setup(build) {
                     i++;
                     build.onEnd((result) => {
                        const errors = result.errors.length;
                        const from = String(i).padStart(String(count).length);
                        console.log(`[${from}/${count}] built ${name} with ${errors} errors`);
                     });
                  }
               }
            ]
         });
      }

      console.log("All builds complete");
   }

   async function _buildtypes() {
      if (!types) return;
      Bun.spawn(["bun", "build:types"], {
         onExit: () => {
            console.log("Types rebuilt");
         }
      });
   }

   await Promise.all([_build(), _buildtypes()]);
}
