import devServer from "@hono/vite-dev-server";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig(async () => {
   /**
    * DEVELOPMENT MODE
    */
   if (process.env.NODE_ENV === "development") {
      return {
         define: {
            __isDev: "1"
         },
         clearScreen: false,
         publicDir: "./src/admin/assets",
         server: {
            host: true,
            port: 28623,
            hmr: {
               overlay: true
            }
         },
         plugins: [
            react(),
            tsconfigPaths(),
            devServer({
               entry: "./vite.dev.ts",
               exclude: [
                  // We need to override this option since the default setting doesn't fit
                  /.*\.tsx?($|\?)/,
                  /^(?!.*\/__admin).*\.(s?css|less)($|\?)/,
                  /^(?!.*\/api).*\.(svg|png)($|\?)/, // exclude except /api
                  /^\/@.+$/,
                  /^\/favicon\.ico$/,
                  /^\/(public|assets|static)\/.+/,
                  /^\/node_modules\/.*/
               ],
               //injectClientScript: true
               injectClientScript: false // This option is buggy, disable it and inject the code manually
            })
         ]
      };
   }

   throw new Error("Don't use vite for building in production");
});
