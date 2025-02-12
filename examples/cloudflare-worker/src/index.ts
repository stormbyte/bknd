/// <reference types="@cloudflare/workers-types" />

import { serve } from "bknd/adapter/cloudflare";

export default serve({
   mode: "fresh",
   onBuilt: async (app) => {
      app.modules.server.get("/custom", (c) => c.json({ hello: "world" }));
   }
});
