import { type FrameworkBkndConfig, createFrameworkApp } from "adapter";
import type { App } from "bknd";

export type RemixBkndConfig = FrameworkBkndConfig;

let app: App;
export function serve(config: RemixBkndConfig = {}) {
   return async (args: { request: Request }) => {
      if (!app) {
         app = await createFrameworkApp(config);
      }
      return app.fetch(args.request);
   };
}
