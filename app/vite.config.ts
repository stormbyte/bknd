import devServer from "@hono/vite-dev-server";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
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

   return {
      define: {
         __isDev: "0"
      },
      publicDir: "./src/ui/assets",
      build: {
         manifest: true,
         outDir: "dist/static"
         /*rollupOptions: { // <-- use this to not require index.html
            input: "./src/ui/main.tsx"
         }*/
      },
      plugins: [react(), tsconfigPaths()]
   } as any;
});
