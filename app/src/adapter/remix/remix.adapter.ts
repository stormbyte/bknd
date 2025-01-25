import { type FrameworkBkndConfig, createFrameworkApp } from "adapter";
import type { App } from "bknd";

export type RemixBkndConfig<Args = RemixContext> = FrameworkBkndConfig<Args>;

type RemixContext = {
   request: Request;
};

let app: App;
export function serve<Args extends RemixContext = RemixContext>(
   config: RemixBkndConfig<Args> = {}
) {
   return async (args: Args) => {
      if (!app) {
         app = await createFrameworkApp(config, args);
      }
      return app.fetch(args.request);
   };
}
