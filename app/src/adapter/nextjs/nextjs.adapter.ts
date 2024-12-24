import type { IncomingMessage, ServerResponse } from "node:http";
import { Api, type App } from "bknd";
import { type FrameworkBkndConfig, createFrameworkApp, nodeRequestToRequest } from "../index";

export type NextjsBkndConfig = FrameworkBkndConfig;

type GetServerSidePropsContext = {
   req: IncomingMessage;
   res: ServerResponse;
   params?: Params;
   query: any;
   preview?: boolean;
   previewData?: any;
   draftMode?: boolean;
   resolvedUrl: string;
   locale?: string;
   locales?: string[];
   defaultLocale?: string;
};

export function createApi({ req }: GetServerSidePropsContext) {
   const request = nodeRequestToRequest(req);
   return new Api({
      host: new URL(request.url).origin,
      headers: request.headers
   });
}

export function withApi<T>(handler: (ctx: GetServerSidePropsContext & { api: Api }) => T) {
   return (ctx: GetServerSidePropsContext & { api: Api }) => {
      return handler({ ...ctx, api: createApi(ctx) });
   };
}

function getCleanRequest(req: Request) {
   // clean search params from "route" attribute
   const url = new URL(req.url);
   url.searchParams.delete("route");
   return new Request(url.toString(), {
      method: req.method,
      headers: req.headers,
      body: req.body
   });
}

let app: App;
export function serve(config: NextjsBkndConfig = {}) {
   return async (req: Request) => {
      if (!app) {
         app = await createFrameworkApp(config);
      }
      const request = getCleanRequest(req);
      return app.fetch(request, process.env);
   };
}
