import type { Metafile, Plugin } from "esbuild";

export const entryOutputMeta = (
   onComplete?: (
      outputs: {
         output: string;
         meta: Metafile["outputs"][string];
      }[]
   ) => void | Promise<void>
): Plugin => ({
   name: "report-entry-output-plugin",
   setup(build) {
      build.initialOptions.metafile = true; // Ensure metafile is enabled

      build.onEnd(async (result) => {
         console.log("result", result);
         if (result?.metafile?.outputs) {
            const entries = build.initialOptions.entryPoints! as string[];

            const outputs = Object.entries(result.metafile.outputs)
               .filter(([, meta]) => {
                  return meta.entryPoint && entries.includes(meta.entryPoint);
               })
               .map(([output, meta]) => ({ output, meta }));
            if (outputs.length === 0) {
               return;
            }

            await onComplete?.(outputs);
         }
      });
   }
});
