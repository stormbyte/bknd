import { serve } from "bknd/adapter/node";

// Actually, all it takes is the following line:
// serve();

// this is optional, if omitted, it uses an in-memory database
/** @type {import("bknd/adapter/node").NodeBkndConfig} */
const config = {
   connection: {
      type: "libsql",
      config: {
         url: ":memory:"
      }
   },
   // this is only required to run inside the same workspace
   // leave blank if you're running this from a different project
   distPath: "../../app/dist"
};

serve(config);
