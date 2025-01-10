import { serve } from "./src/adapter/vite";

const credentials = {
   url: import.meta.env.VITE_DB_URL!,
   authToken: import.meta.env.VITE_DB_TOKEN!
};
if (!credentials.url) {
   throw new Error("Missing VITE_DB_URL env variable. Add it to .env file");
}

export default serve({
   connection: {
      type: "libsql",
      config: credentials
   },
   forceDev: true
});
