// @ts-ignore somehow causes types:build issues on app
import { type BunBkndConfig, serve } from "bknd/adapter/bun";

// Actually, all it takes is the following line:
// serve();

// this is optional, if omitted, it uses an in-memory database
const config: BunBkndConfig = {
   connection: {
      url: ":memory:"
   },
   // this is only required to run inside the same workspace
   // leave blank if you're running this from a different project
   distPath: "../../app/dist"
};

serve(config);
