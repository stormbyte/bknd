import { type NextjsBkndConfig, getApp as getBkndApp } from "bknd/adapter/nextjs";
import { registerLocalMediaAdapter } from "bknd/adapter/node";
import { headers } from "next/headers";

// The local media adapter works well in development, and server based
// deployments. However, on vercel or any other serverless deployments,
// you shouldn't use a filesystem based media adapter.
//
// Additionally, if you run the bknd api on the "edge" runtime,
// this would not work as well.
//
// For production, it is recommended to uncomment the line below.
registerLocalMediaAdapter();

export const config = {
   connection: {
      url: process.env.DB_URL as string,
      authToken: process.env.DB_TOKEN as string,
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
