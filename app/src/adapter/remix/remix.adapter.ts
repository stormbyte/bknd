import { type FrameworkBkndConfig, createFrameworkApp } from "adapter";
import type { App } from "bknd";
import { Api } from "bknd/client";

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

export function withApi<Args extends { request: Request; context: { api: Api } }, R>(
   handler: (args: Args, api: Api) => Promise<R>
) {
   return async (args: Args) => {
      if (!args.context.api) {
         args.context.api = new Api({
            host: new URL(args.request.url).origin,
            headers: args.request.headers
         });
         await args.context.api.verifyAuth();
      }

      return handler(args, args.context.api);
   };
}
