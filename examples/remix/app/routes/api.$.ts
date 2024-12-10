import { serve } from "bknd/adapter/remix";

const handler = serve({
   connection: {
      type: "libsql",
      config: {
         url: "file:test.db"
      }
   }
});

export const loader = handler;
export const action = handler;
