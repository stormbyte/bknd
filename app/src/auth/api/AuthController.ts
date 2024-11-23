import type { AppAuth } from "auth";
import type { ClassController } from "core";
import { Hono, type MiddlewareHandler } from "hono";

export class AuthController implements ClassController {
   constructor(private auth: AppAuth) {}

   get guard() {
      return this.auth.ctx.guard;
   }

   getMiddleware: MiddlewareHandler = async (c, next) => {
      const user = await this.auth.authenticator.resolveAuthFromRequest(c);
      this.auth.ctx.guard.setUserContext(user);

      await next();
   };

   getController(): Hono<any> {
      const hono = new Hono();
      const strategies = this.auth.authenticator.getStrategies();

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

      hono.get("/logout", async (c) => {
         await this.auth.authenticator.logout(c);
         return c.json({ ok: true });
      });

      hono.get("/strategies", async (c) => {
         const { strategies, basepath } = this.auth.toJSON(false);
         return c.json({ strategies, basepath });
      });

      return hono;
   }
}
