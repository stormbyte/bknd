import { type Permission, config } from "core";
import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import type { ServerEnv } from "modules/Module";

export function shouldSkipAuth(req: Request) {
   const skip = new URL(req.url).pathname.startsWith(config.server.assets_path);
   if (skip) {
      //console.log("skip auth for", req.url);
   }
   return skip;
}

export const auth = createMiddleware<ServerEnv>(async (c, next) => {
   // make sure to only register once
   if (c.get("auth_registered")) {
      throw new Error("auth middleware already registered");
   }
   c.set("auth_registered", true);

   const skipped = shouldSkipAuth(c.req.raw);
   const app = c.get("app");
   const guard = app.modules.ctx().guard;
   const authenticator = app.module.auth.authenticator;

   if (!skipped) {
      const resolved = c.get("auth_resolved");
      if (!resolved) {
         if (!app.module.auth.enabled) {
            guard.setUserContext(undefined);
         } else {
            guard.setUserContext(await authenticator.resolveAuthFromRequest(c));

            // renew cookie if applicable
            authenticator.requestCookieRefresh(c);
         }
      }
   }

   await next();

   // release
   guard.setUserContext(undefined);
   authenticator.resetUser();
   c.set("auth_resolved", false);
});

export const permission = (...permissions: Permission[]) =>
   createMiddleware<ServerEnv>(async (c, next) => {
      if (!c.get("auth_registered")) {
         throw new Error("auth middleware not registered, cannot check permissions");
      }

      if (!shouldSkipAuth(c.req.raw)) {
         const app = c.get("app");
         if (app) {
            const p = Array.isArray(permissions) ? permissions : [permissions];
            const guard = app.modules.ctx().guard;
            for (const permission of p) {
               guard.throwUnlessGranted(permission);
            }
         } else {
            console.warn("app not in context, skip permission check");
         }
      }

      await next();
   });
