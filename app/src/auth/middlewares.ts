import { type Permission, config } from "core";
import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import type { ServerEnv } from "modules/Module";

async function resolveAuth(app: ServerEnv["Variables"]["app"], c: Context<ServerEnv>) {
   const resolved = c.get("auth_resolved") ?? false;
   if (resolved) {
      return;
   }
   if (!app.module.auth.enabled) {
      return;
   }

   const authenticator = app.module.auth.authenticator;
   const guard = app.modules.ctx().guard;

   guard.setUserContext(await authenticator.resolveAuthFromRequest(c));

   // renew cookie if applicable
   authenticator.requestCookieRefresh(c);
}

export function shouldSkipAuth(req: Request) {
   const skip = new URL(req.url).pathname.startsWith(config.server.assets_path);
   if (skip) {
      //console.log("skip auth for", req.url);
   }
   return skip;
}

export const auth = createMiddleware<ServerEnv>(async (c, next) => {
   if (!shouldSkipAuth(c.req.raw)) {
      // make sure to only register once
      if (c.get("auth_registered")) {
         return;
      }

      await resolveAuth(c.get("app"), c);
      c.set("auth_registered", true);
   }

   await next();
});

export const permission = (...permissions: Permission[]) =>
   createMiddleware<ServerEnv>(async (c, next) => {
      if (!shouldSkipAuth) {
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
