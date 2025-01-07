import type { AppAuth } from "auth";
import { Controller } from "modules/Controller";

export class AuthController extends Controller {
   constructor(private auth: AppAuth) {
      super();
   }

   get guard() {
      return this.auth.ctx.guard;
   }

   override getController() {
      const hono = this.create();
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
         if (this.auth.authenticator.isJsonRequest(c)) {
            return c.json({ ok: true });
         }

         const referer = c.req.header("referer");
         if (referer) {
            return c.redirect(referer);
         }

         return c.redirect("/");
      });

      hono.get("/strategies", async (c) => {
         const { strategies, basepath } = this.auth.toJSON(false);
         return c.json({ strategies, basepath });
      });

      return hono;
   }
}
