import { type Options, build } from "tsup";

const args = process.argv.slice(2);

const watch = args.includes("--watch");
const minify = args.includes("--minify");

function baseConfig(adapter: string): Options {
   return {
      entry: [`src/adapter/${adapter}`],
      format: ["esm"],
      platform: "neutral",
      minify: false,
      outDir: `dist/adapter/${adapter}`,
      watch,
      define: {
         __isDev: "0"
      },
      external: [
         "cloudflare:workers",
         /^@?hono.*?/,
         /^bknd.*?/,
         /.*\.html$/,
         /^node.*/,
         /^react.*?/
      ],
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
   platform: "node",
   external: [...baseConfig("nextjs").external!, /^next.*/]
});

await build({
   ...baseConfig("remix"),
   format: ["esm", "cjs"]
});

await build({
   ...baseConfig("bun"),
   external: [/^hono.*?/, /^bknd.*?/, "node:path"]
});

await build({
   ...baseConfig("node"),
   format: ["esm", "cjs"],
   platform: "node"
});
