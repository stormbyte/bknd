import type { App } from "bknd";
import { type FrameworkBkndConfig, createFrameworkApp } from "bknd/adapter";
import { Api } from "bknd/client";

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
