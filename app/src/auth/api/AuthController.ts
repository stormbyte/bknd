import type { AppAuth } from "auth";
import { type ClassController, isDebug } from "core";
import { Hono, type MiddlewareHandler } from "hono";

export class AuthController implements ClassController {
   constructor(private auth: AppAuth) {}

   get guard() {
      return this.auth.ctx.guard;
   }

   getMiddleware: MiddlewareHandler = async (c, next) => {
      // @todo: ONLY HOTFIX
      // middlewares are added for all routes are registered. But we need to make sure that
      // only HTML/JSON routes are adding a cookie to the response. Config updates might
      // also use an extension "syntax", e.g. /api/system/patch/data/entities.posts
      // This middleware should be extracted and added by each Controller individually,
      // but it requires access to the auth secret.
      // Note: This doesn't mean endpoints aren't protected, just the cookie is not set.
      const url = new URL(c.req.url);
      const last = url.pathname.split("/")?.pop();
      const ext = last?.includes(".") ? last.split(".")?.pop() : undefined;
      if (
         !this.auth.authenticator.isJsonRequest(c) &&
         ["GET", "HEAD", "OPTIONS"].includes(c.req.method) &&
         ext &&
         ["js", "css", "png", "jpg", "jpeg", "svg", "ico"].includes(ext)
      ) {
         isDebug() && console.log("Skipping auth", { ext }, url.pathname);
      } else {
         const user = await this.auth.authenticator.resolveAuthFromRequest(c);
         this.auth.ctx.guard.setUserContext(user);
      }

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
