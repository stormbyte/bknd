import { type Options, build } from "tsup";

const args = process.argv.slice(2);

const watch = args.includes("--watch");
const minify = args.includes("--minify");

function baseConfig(adapter: string): Options {
   return {
      entry: [`src/adapter/${adapter}`],
      format: ["esm"],
      platform: "neutral",
      minify,
      outDir: `dist/adapter/${adapter}`,
      watch,
      define: {
         __isDev: "0"
      },
      external: [new RegExp(`^(?!\\.\\/src\\/adapter\\/${adapter}\\/).+$`)],
      metafile: true,
      splitting: false,
      treeshake: true
   };
}

await build({
   ...baseConfig("vite"),
   platform: "node"
});

await build({
   ...baseConfig("cloudflare")
});

await build({
   ...baseConfig("nextjs"),
   format: ["esm", "cjs"],
   platform: "node"
});

await build({
   ...baseConfig("remix"),
   format: ["esm", "cjs"]
});

await build({
   ...baseConfig("bun")
});
