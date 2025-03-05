import { App, type LocalApiOptions } from "bknd";
import { registerLocalMediaAdapter } from "bknd/adapter/node";
import { type RemixBkndConfig, getApp as getBkndApp } from "bknd/adapter/remix";
import { boolean, em, entity, text } from "bknd/data";
import { secureRandomString } from "bknd/utils";

// since we're running in node, we can register the local media adapter
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

const config = {
   // we can use any libsql config, and if omitted, uses in-memory
   connection: {
      url: "file:test.db",
   },
   // an initial config is only applied if the database is empty
   initialConfig: {
      data: schema.toJSON(),
      // we're enabling auth ...
      auth: {
         enabled: true,
         jwt: {
            issuer: "bknd-remix-example",
            secret: secureRandomString(64),
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
} as const satisfies RemixBkndConfig;

export async function getApp(args?: { request: Request }) {
   return await getBkndApp(config, args);
}

export async function getApi(options?: LocalApiOptions) {
   const app = await getApp();
   return await app.getApi(options);
}
