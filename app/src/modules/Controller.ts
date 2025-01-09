import { auth, permission } from "auth/middlewares";
import { Hono } from "hono";
import type { ServerEnv } from "modules/Module";

export class Controller {
   protected middlewares = {
      auth,
      permission
   };

   protected create(): Hono<ServerEnv> {
      return Controller.createServer();
   }

   static createServer(): Hono<ServerEnv> {
      return new Hono<ServerEnv>();
   }

   getController(): Hono<ServerEnv> {
      return this.create();
   }
}
