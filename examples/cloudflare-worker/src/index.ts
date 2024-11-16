import { serve } from "bknd/adapter/cloudflare";

import manifest from "__STATIC_CONTENT_MANIFEST";

export default serve(
   {
      app: (env: Env) => ({
         connection: {
            type: "libsql",
            config: {
               url: env.DB_URL,
               authToken: env.DB_TOKEN
            }
         }
      }),
      onBuilt: async (app) => {
         app.modules.server.get("/", (c) => c.json({ hello: "world" }));
      },
      setAdminHtml: true
   },
   manifest
);
