import { createClient } from "@libsql/client/node";
import { serveFresh } from "./src/adapter/vite";
import { LibsqlConnection } from "./src/data";
import { StorageLocalAdapter } from "./src/media/storage/adapters/StorageLocalAdapter";
import { registries } from "./src/modules/registries";

registries.media.add("local", {
   cls: StorageLocalAdapter,
   schema: StorageLocalAdapter.prototype.getSchema()
});

const connection = new LibsqlConnection(
   createClient({
      url: "file:.db/test.db"
   })
);

const app = await serveFresh({
   app: {
      connection
   },
   setAdminHtml: true
});

export default app;
