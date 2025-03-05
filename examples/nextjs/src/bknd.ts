import { type NextjsBkndConfig, getApp as getBkndApp } from "bknd/adapter/nextjs";
import { App } from "bknd";
import { boolean, em, entity, text } from "bknd/data";
import { registerLocalMediaAdapter } from "bknd/adapter/node";
import { secureRandomString } from "bknd/utils";
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

const schema = em({
   todos: entity("todos", {
      title: text(),
      done: boolean(),
   }),
});

// register your schema to get automatic type completion
type Database = (typeof schema)["DB"];
declare module "bknd/core" {
   interface DB extends Database {}
}

export const config = {
   connection: {
      url: "file:data.db",
   },
   // an initial config is only applied if the database is empty
   initialConfig: {
      data: schema.toJSON(),
      // we're enabling auth ...
      auth: {
         enabled: true,
         jwt: {
            issuer: "bknd-nextjs-example",
            secret: secureRandomString(64),
         },
         cookie: {
            pathSuccess: "/ssr",
            pathLoggedOut: "/ssr",
         },
      },
      // ... and media
      media: {
         enabled: true,
         adapter: {
            type: "local",
            config: {
               path: "./public",
            },
         },
      },
   },
   options: {
      // the seed option is only executed if the database was empty
      seed: async (ctx) => {
         await ctx.em.mutator("todos").insertMany([
            { title: "Learn bknd", done: true },
            { title: "Build something cool", done: false },
         ]);
      },
   },
   // here we can hook into the app lifecycle events ...
   beforeBuild: async (app) => {
      app.emgr.onEvent(
         App.Events.AppFirstBoot,
         async () => {
            // ... to create an initial user
            await app.module.auth.createUser({
               email: "test@bknd.io",
               password: "12345678",
            });
         },
         "sync",
      );
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
