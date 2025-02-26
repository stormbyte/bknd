import { overridePackageJson } from "cli/commands/create/npm";
import type { Template } from ".";

// @todo: add `concurrently`?
export const nextjs = {
   key: "nextjs",
   title: "Next.js Basic",
   integration: "nextjs",
   description: "A basic bknd Next.js starter",
   path: "gh:bknd-io/bknd/examples/nextjs",
   scripts: {
      install: "npm install --force",
   },
   ref: true,
   preinstall: async (ctx) => {
      // locally it's required to overwrite react, here it is not
      await overridePackageJson(
         (pkg) => ({
            ...pkg,
            dependencies: {
               ...pkg.dependencies,
               react: undefined,
               "react-dom": undefined,
            },
         }),
         { dir: ctx.dir },
      );
   },
} as const satisfies Template;
