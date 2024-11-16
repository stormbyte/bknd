import { serve } from "bknd/adapter/remix";

const handler = serve({
   connection: {
      type: "libsql",
      config: {
         url: "http://localhost:8080"
      }
   }
});

export const loader = handler;
export const action = handler;
