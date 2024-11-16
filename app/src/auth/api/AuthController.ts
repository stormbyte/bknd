import type { AppAuth } from "auth";
import type { ClassController } from "core";
import { Hono, type MiddlewareHandler } from "hono";

export class AuthController implements ClassController {
   constructor(private auth: AppAuth) {}

   getMiddleware: MiddlewareHandler = async (c, next) => {
      // @todo: consider adding app name to the payload, because user is not refetched

      //try {
      if (c.req.raw.headers.has("Authorization")) {
         const bearerHeader = String(c.req.header("Authorization"));
         const token = bearerHeader.replace("Bearer ", "");
         const verified = await this.auth.authenticator.verify(token);

         // @todo: don't extract user from token, but from the database or cache
         this.auth.ctx.guard.setUserContext(this.auth.authenticator.getUser());
         /*console.log("jwt verified?", {
            verified,
            auth: this.auth.authenticator.isUserLoggedIn()
         });*/
      } else {
         this.auth.authenticator.__setUserNull();
      }
      /* } catch (e) {
         this.auth.authenticator.__setUserNull();
      }*/

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
         return c.json({ strategies: this.auth.toJSON(false).strategies });
      });

      return hono;
   }
}
