// @ts-ignore somehow causes types:build issues on app
import type { CreateAppConfig } from "bknd";
// @ts-ignore somehow causes types:build issues on app
import { serve } from "bknd/adapter/bun";

// this is optional, if omitted, it uses an in-memory database
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
   fetch: serve(
      config,
      // this is only required to run inside the same workspace
      // leave blank if you're running this from a different project
      "../../app/dist"
   )
});

console.log("Server running at http://localhost:1337");
