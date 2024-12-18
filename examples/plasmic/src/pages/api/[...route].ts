import { serve } from "bknd/adapter/nextjs";

export const config = {
   runtime: "edge",
   unstable_allowDynamic: ["**/*.js"]
};

export default serve({
   connection: {
      type: "libsql",
      config: {
         url: process.env.DB_URL!,
         authToken: process.env.DB_TOKEN!
      }
   }
});
