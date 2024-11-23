import { serve } from "bknd/adapter/nextjs";
import type { PageConfig } from "next";

export const config: PageConfig = {
   runtime: "edge"
};

export default serve({
   connection: {
      type: "libsql",
      config: {
         url: "http://localhost:8080"
      }
   }
});
