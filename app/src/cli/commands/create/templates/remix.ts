import { overridePackageJson } from "cli/commands/create/npm";
import type { Template } from ".";

export const remix = {
   key: "remix",
   title: "Remix Basic",
   integration: "remix",
   description: "A basic bknd Remix starter",
   path: "gh:bknd-io/bknd/examples/remix",
   ref: true,
   preinstall: async (ctx) => {
      // locally it's required to overwrite react
      await overridePackageJson(
         (pkg) => ({
            ...pkg,
            dependencies: {
               ...pkg.dependencies,
               react: "^18.2.0",
               "react-dom": "^18.2.0"
            }
         }),
         { dir: ctx.dir }
      );
   }
} as const satisfies Template;
