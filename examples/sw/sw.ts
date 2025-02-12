// To support types
// https://github.com/microsoft/TypeScript/issues/14877

declare const self: ServiceWorkerGlobalScope;

import { App } from "bknd";

async function getBknd() {
   const bknd = App.create({
      connection: {
         url: "http://localhost:8080"
      }
   });
   await bknd.build();
   return bknd;
}

self.addEventListener("fetch", async (e) => {
   // only intercept api requests
   if (e.request.url.includes("/api/")) {
      e.respondWith(
         (async () => {
            try {
               const bknd = await getBknd();
               return bknd.fetch(e.request);
            } catch (e) {
               return new Response(e.message, { status: 500 });
            }
         })()
      );
   }
});
