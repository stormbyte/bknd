import { App, type CreateAppConfig } from "bknd";
import { isDebug } from "bknd/core";

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
export function serve(config: CreateAppConfig) {
   return async (req: Request) => {
      if (!app || isDebug()) {
         app = App.create(config);
         await app.build();
      }
      const request = getCleanRequest(req);
      return app.fetch(request, process.env);
   };
}
