import { serve } from "bknd/adapter/astro";

export const prerender = false;

export const ALL = serve({
   connection: {
      type: "libsql",
      config: {
         url: "file:test.db"
      }
   }
});
