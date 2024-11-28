import type { APIRoute } from "astro";
import { App } from "bknd";

export const prerender = false;

export const ALL: APIRoute = async ({ request }) => {
   const app = App.create({
      connection: {
         type: "libsql",
         config: {
            url: "http://127.0.0.1:8080"
         }
      }
   });

   await app.build();
   return app.fetch(request);
};
