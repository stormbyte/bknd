import { serve } from "bknd/adapter/nextjs";
import type { PageConfig } from "next";

export const config: PageConfig = {
   runtime: "edge"
};

export default serve({
   connection: {
      type: "libsql",
      config: {
         url: process.env.DB_URL!,
         authToken: process.env.DB_AUTH_TOKEN!
      }
   }
}); /*
let app: App;

async function getApp() {
   if (!app) {
      app = App.create({
         connection: {
            type: "libsql",
            config: {
               url: process.env.DB_URL!,
               authToken: process.env.DB_AUTH_TOKEN!
            }
         }
      });
      await app.build();
   }

   return app;
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

export default async (req: Request, requestContext: any) => {
   //console.log("here");
   if (!app) {
      app = await getApp();
   }
   //const app = await getApp();
   const request = getCleanRequest(req);
   //console.log("url", req.url);
   //console.log("req", req);
   return app.fetch(request, process.env);
};
//export default handle(app.server.getInstance())
*/
