/*
// somehow causes types:build issues on app

import type { CreateAppConfig } from "bknd";
import { serve } from "bknd/adapter/bun";

const root = "../../node_modules/bknd/dist";
const config = {
   connection: {
      type: "libsql",
      config: {
         url: "http://localhost:8080"
      }
   }
} satisfies CreateAppConfig;

Bun.serve({
   port: 1337,
   fetch: serve(config, root)
});

console.log("Server running at http://localhost:1337");
s*/
