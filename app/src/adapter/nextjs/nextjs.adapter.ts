import type { IncomingMessage, ServerResponse } from "node:http";
import { nodeRequestToRequest } from "adapter/utils";
import type { App } from "bknd";
import { type FrameworkBkndConfig, createFrameworkApp } from "bknd/adapter";
import { Api } from "bknd/client";

export type NextjsBkndConfig = FrameworkBkndConfig & {
   cleanSearch?: string[];
};

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
   return async (ctx: GetServerSidePropsContext & { api: Api }) => {
      const api = createApi(ctx);
      await api.verifyAuth();
      return handler({ ...ctx, api });
   };
}

function getCleanRequest(
   req: Request,
   { cleanSearch = ["route"] }: Pick<NextjsBkndConfig, "cleanSearch">
) {
   const url = new URL(req.url);
   cleanSearch?.forEach((k) => url.searchParams.delete(k));

   return new Request(url.toString(), {
      method: req.method,
      headers: req.headers,
      body: req.body
   });
}

let app: App;
export function serve({ cleanSearch, ...config }: NextjsBkndConfig = {}) {
   return async (req: Request) => {
      if (!app) {
         app = await createFrameworkApp(config);
      }
      const request = getCleanRequest(req, { cleanSearch });
      return app.fetch(request, process.env);
   };
}
