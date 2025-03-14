import type { App } from "bknd";
import { type FrameworkBkndConfig, createFrameworkApp } from "bknd/adapter";
import { isNode } from "core/utils";

export type NextjsBkndConfig = FrameworkBkndConfig & {
   cleanRequest?: { searchParams?: string[] };
};

type NextjsContext = {
   env: Record<string, string | undefined>;
};

let app: App;
let building: boolean = false;

export async function getApp<Args extends NextjsContext = NextjsContext>(
   config: NextjsBkndConfig,
   args?: Args,
) {
   if (building) {
      while (building) {
         await new Promise((resolve) => setTimeout(resolve, 5));
      }
      if (app) return app;
   }

   building = true;
   if (!app) {
      app = await createFrameworkApp(config, args);
      await app.build();
   }
   building = false;
   return app;
}

function getCleanRequest(req: Request, cleanRequest: NextjsBkndConfig["cleanRequest"]) {
   if (!cleanRequest) return req;

   const url = new URL(req.url);
   cleanRequest?.searchParams?.forEach((k) => url.searchParams.delete(k));

   if (isNode()) {
      return new Request(url.toString(), {
         method: req.method,
         headers: req.headers,
         body: req.body,
         // @ts-ignore
         duplex: "half",
      });
   }

   return new Request(url.toString(), {
      method: req.method,
      headers: req.headers,
      body: req.body,
   });
}

export function serve({ cleanRequest, ...config }: NextjsBkndConfig = {}) {
   return async (req: Request) => {
      if (!app) {
         app = await getApp(config, { env: process.env ?? {} });
      }
      const request = getCleanRequest(req, cleanRequest);
      return app.fetch(request);
   };
}
