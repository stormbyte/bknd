import { auth, permission } from "auth/middlewares";
import { Hono } from "hono";
import type { ServerEnv } from "modules/Module";

export class Controller {
   protected middlewares = {
      auth,
      permission
   }

   protected create({ auth }: { auth?: boolean } = {}): Hono<ServerEnv> {
      const server = Controller.createServer();
      if (auth !== false) {
         server.use(this.middlewares.auth);
      }
      return server;
   }

   static createServer(): Hono<ServerEnv> {
      return new Hono<ServerEnv>();
   }

   getController(): Hono<ServerEnv> {
      return this.create();
   }
}