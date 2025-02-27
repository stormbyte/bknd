import { type NextjsBkndConfig, getApp as getBkndApp } from "bknd/adapter/nextjs";
import { registerLocalMediaAdapter } from "bknd/adapter/node";
import { headers } from "next/headers";

registerLocalMediaAdapter();

export const config = {
   connection: {
      // make sure to use a remote URL for production!
      url: "file:data.db",
   },
} as const satisfies NextjsBkndConfig;

export async function getApp() {
   return await getBkndApp(config);
}

export async function getApi(opts?: { verify?: boolean }) {
   const app = await getApp();
   if (opts?.verify) {
      const api = app.getApi({ headers: await headers() });
      await api.verifyAuth();
      return api;
   }

   return app.getApi();
}
