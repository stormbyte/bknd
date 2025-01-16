import type { Permission } from "core";
import { patternMatch } from "core/utils";
import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import type { ServerEnv } from "modules/Module";

function getPath(reqOrCtx: Request | Context) {
   const req = reqOrCtx instanceof Request ? reqOrCtx : reqOrCtx.req.raw;
   return new URL(req.url).pathname;
}

export function shouldSkip(c: Context<ServerEnv>, skip?: (string | RegExp)[]) {
   if (c.get("auth_skip")) return true;

   const req = c.req.raw;
   if (!skip) return false;

   const path = getPath(req);
   const result = skip.some((s) => patternMatch(path, s));

   c.set("auth_skip", result);
   return result;
}

export const auth = (options?: {
   skip?: (string | RegExp)[];
}) =>
   createMiddleware<ServerEnv>(async (c, next) => {
      const app = c.get("app");
      const guard = app?.modules.ctx().guard;
      const authenticator = app?.module.auth.authenticator;

      let skipped = shouldSkip(c, options?.skip) || !app?.module.auth.enabled;

      // make sure to only register once
      if (c.get("auth_registered")) {
         skipped = true;
         console.warn(`auth middleware already registered for ${getPath(c)}`);
      } else {
         c.set("auth_registered", true);

         if (!skipped) {
            const resolved = c.get("auth_resolved");
            if (!resolved) {
               if (!app?.module.auth.enabled) {
                  guard?.setUserContext(undefined);
               } else {
                  guard?.setUserContext(await authenticator?.resolveAuthFromRequest(c));
                  c.set("auth_resolved", true);
               }
            }
         }
      }

      await next();

      if (!skipped) {
         // renew cookie if applicable
         authenticator?.requestCookieRefresh(c);
      }

      // release
      guard?.setUserContext(undefined);
      authenticator?.resetUser();
      c.set("auth_resolved", false);
   });

export const permission = (
   permission: Permission | Permission[],
   options?: {
      onGranted?: (c: Context<ServerEnv>) => Promise<Response | void | undefined>;
      onDenied?: (c: Context<ServerEnv>) => Promise<Response | void | undefined>;
   }
) =>
   // @ts-ignore
   createMiddleware<ServerEnv>(async (c, next) => {
      const app = c.get("app");
      //console.log("skip?", c.get("auth_skip"));

      // in tests, app is not defined
      if (!c.get("auth_registered") || !app) {
         const msg = `auth middleware not registered, cannot check permissions for ${getPath(c)}`;
         if (app?.module.auth.enabled) {
            throw new Error(msg);
         } else {
            console.warn(msg);
         }
      } else if (!c.get("auth_skip")) {
         const guard = app.modules.ctx().guard;
         const permissions = Array.isArray(permission) ? permission : [permission];

         if (options?.onGranted || options?.onDenied) {
            let returned: undefined | void | Response;
            if (permissions.every((p) => guard.granted(p))) {
               returned = await options?.onGranted?.(c);
            } else {
               returned = await options?.onDenied?.(c);
            }
            if (returned instanceof Response) {
               return returned;
            }
         } else {
            permissions.some((p) => guard.throwUnlessGranted(p));
         }
      }

      await next();
   });
