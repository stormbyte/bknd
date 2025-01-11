import { type Permission, config } from "core";
import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import type { ServerEnv } from "modules/Module";

function getPath(reqOrCtx: Request | Context) {
   const req = reqOrCtx instanceof Request ? reqOrCtx : reqOrCtx.req.raw;
   return new URL(req.url).pathname;
}

export function shouldSkipAuth(req: Request) {
   const skip = getPath(req).startsWith(config.server.assets_path);
   if (skip) {
      //console.log("skip auth for", req.url);
   }
   return skip;
}

export const auth = createMiddleware<ServerEnv>(async (c, next) => {
   // make sure to only register once
   if (c.get("auth_registered")) {
      throw new Error(`auth middleware already registered for ${getPath(c)}`);
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
      const app = c.get("app");
      // in tests, app is not defined
      if (!c.get("auth_registered")) {
         const msg = `auth middleware not registered, cannot check permissions for ${getPath(c)}`;
         if (app?.module.auth.enabled) {
            throw new Error(msg);
         } else {
            console.warn(msg);
         }
      } else if (!shouldSkipAuth(c.req.raw)) {
         const p = Array.isArray(permissions) ? permissions : [permissions];
         const guard = app.modules.ctx().guard;
         for (const permission of p) {
            guard.throwUnlessGranted(permission);
         }
      }

      await next();
   });
