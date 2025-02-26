import type { App } from "App";
import { type Context, Hono } from "hono";
import * as middlewares from "modules/middlewares";

export type ServerEnv = {
   Variables: {
      app: App;
      // to prevent resolving auth multiple times
      auth?: {
         resolved: boolean;
         registered: boolean;
         skip: boolean;
         user?: { id: any; role?: string; [key: string]: any };
      };
      html?: string;
   };
};

export class Controller {
   protected middlewares = middlewares;

   protected create(): Hono<ServerEnv> {
      return Controller.createServer();
   }

   static createServer(): Hono<ServerEnv> {
      return new Hono<ServerEnv>();
   }

   getController(): Hono<ServerEnv> {
      return this.create();
   }

   protected isJsonRequest(c: Context<ServerEnv>) {
      return (
         c.req.header("Content-Type") === "application/json" ||
         c.req.header("Accept") === "application/json"
      );
   }

   protected notFound(c: Context<ServerEnv>) {
      if (this.isJsonRequest(c)) {
         return c.json({ error: "Not found" }, 404);
      }

      return c.notFound();
   }
}
