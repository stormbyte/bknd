import type { AppAuth } from "auth";
import type { ClassController } from "core";
import { Hono, type MiddlewareHandler } from "hono";
import * as SystemPermissions from "modules/permissions";

export class AuthController implements ClassController {
   constructor(private auth: AppAuth) {}

   get guard() {
      return this.auth.ctx.guard;
   }

   getMiddleware: MiddlewareHandler = async (c, next) => {
      let token: string | undefined;
      if (c.req.raw.headers.has("Authorization")) {
         const bearerHeader = String(c.req.header("Authorization"));
         token = bearerHeader.replace("Bearer ", "");
      }

      if (token) {
         // @todo: don't extract user from token, but from the database or cache
         await this.auth.authenticator.verify(token);
         this.auth.ctx.guard.setUserContext(this.auth.authenticator.getUser());
      } else {
         this.auth.authenticator.__setUserNull();
      }

      await next();
   };

   getController(): Hono<any> {
      const hono = new Hono();
      const strategies = this.auth.authenticator.getStrategies();
      //console.log("strategies", strategies);

      for (const [name, strategy] of Object.entries(strategies)) {
         //console.log("registering", name, "at", `/${name}`);
         hono.route(`/${name}`, strategy.getController(this.auth.authenticator));
      }

      hono.get("/me", async (c) => {
         if (this.auth.authenticator.isUserLoggedIn()) {
            return c.json({ user: await this.auth.authenticator.getUser() });
         }

         return c.json({ user: null }, 403);
      });

      hono.get("/strategies", async (c) => {
         const { strategies, basepath } = this.auth.toJSON(false);
         return c.json({ strategies, basepath });
      });

      return hono;
   }
}
