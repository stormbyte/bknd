import { serve } from "bknd/adapter/node";

// this is optional, if omitted, it uses an in-memory database
/** @type {import("bknd").CreateAppConfig} */
const config = {
   connection: {
      type: "libsql",
      config: {
         url: "http://localhost:8080"
      }
   }
};

serve(config, {
   relativeDistPath: "../../node_modules/bknd/dist",
   port: 1337,
   listener: ({ port }) => {
      console.log(`Server is running on http://localhost:${port}`);
   }
});
