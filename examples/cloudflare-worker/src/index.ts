import { serve } from "bknd/adapter/cloudflare";

export default serve({
   app: (args) => ({
      connection: {
         type: "libsql",
         config: {
            url: "http://localhost:8080"
         }
      }
   }),
   onBuilt: async (app) => {
      app.modules.server.get("/custom", (c) => c.json({ hello: "world" }));
   }
});
