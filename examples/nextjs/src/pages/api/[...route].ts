import { App } from "bknd";
import { serve } from "bknd/adapter/nextjs";
import { boolean, em, entity, text } from "bknd/data";
import { secureRandomString } from "bknd/utils";

export const config = {
   runtime: "edge",
   // add a matcher for bknd dist to allow dynamic otherwise build may fail.
   // inside this repo it's '../../app/dist/index.js', outside probably inside node_modules
   // see https://github.com/vercel/next.js/issues/51401
   // and https://github.com/vercel/next.js/pull/69402
   unstable_allowDynamic: ["**/*.js"]
};

// the em() function makes it easy to create an initial schema
const schema = em({
   todos: entity("todos", {
      title: text(),
      done: boolean()
   })
});

// register your schema to get automatic type completion
type Database = (typeof schema)["DB"];
declare module "bknd/core" {
   interface DB extends Database {}
}

export default serve({
   // we can use any libsql config, and if omitted, uses in-memory
   connection: {
      url: "http://localhost:8080"
   },
   // an initial config is only applied if the database is empty
   initialConfig: {
      data: schema.toJSON(),
      // we're enabling auth ...
      auth: {
         enabled: true,
         jwt: {
            secret: secureRandomString(64)
         }
      }
   },
   options: {
      // the seed option is only executed if the database was empty
      seed: async (ctx) => {
         await ctx.em.mutator("todos").insertMany([
            { title: "Learn bknd", done: true },
            { title: "Build something cool", done: false }
         ]);
      }
   },
   // here we can hook into the app lifecycle events ...
   beforeBuild: async (app) => {
      app.emgr.onEvent(
         App.Events.AppFirstBoot,
         async () => {
            // ... to create an initial user
            await app.module.auth.createUser({
               email: "ds@bknd.io",
               password: "12345678"
            });
         },
         "sync"
      );
   }
});
