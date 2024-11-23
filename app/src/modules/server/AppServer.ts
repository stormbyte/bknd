import { Exception, isDebug } from "core";
import { type Static, StringEnum, Type } from "core/utils";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { timing } from "hono/timing";
import { Module } from "modules/Module";
import * as SystemPermissions from "modules/permissions";

const serverMethods = ["GET", "POST", "PATCH", "PUT", "DELETE"];
export const serverConfigSchema = Type.Object(
   {
      admin: Type.Object(
         {
            basepath: Type.Optional(Type.String({ default: "", pattern: "^(/.+)?$" })),
            color_scheme: Type.Optional(StringEnum(["dark", "light"], { default: "light" })),
            logo_return_path: Type.Optional(
               Type.String({
                  default: "/",
                  description: "Path to return to after *clicking* the logo"
               })
            )
         },
         { default: {}, additionalProperties: false }
      ),
      cors: Type.Object(
         {
            origin: Type.String({ default: "*" }),
            allow_methods: Type.Array(StringEnum(serverMethods), {
               default: serverMethods,
               uniqueItems: true
            }),
            allow_headers: Type.Array(Type.String(), {
               default: ["Content-Type", "Content-Length", "Authorization", "Accept"]
            })
         },
         { default: {}, additionalProperties: false }
      )
   },
   {
      additionalProperties: false
   }
);

export type AppServerConfig = Static<typeof serverConfigSchema>;

/*declare global {
   interface Request {
      cf: IncomingRequestCfProperties;
   }
}*/

export class AppServer extends Module<typeof serverConfigSchema> {
   //private admin_html?: string;

   override getRestrictedPaths() {
      return [];
   }

   get client() {
      return this.ctx.server;
   }

   getSchema() {
      return serverConfigSchema;
   }

   override async build() {
      this.client.use(
         "*",
         cors({
            origin: this.config.cors.origin,
            allowMethods: this.config.cors.allow_methods,
            allowHeaders: this.config.cors.allow_headers
         })
      );

      this.client.onError((err, c) => {
         //throw err;
         console.error(err);

         if (err instanceof Response) {
            return err;
         }

         /*if (isDebug()) {
            console.log("accept", c.req.header("Accept"));
            if (c.req.header("Accept") === "application/json") {
               const stack = err.stack;

               if ("toJSON" in err && typeof err.toJSON === "function") {
                  return c.json({ ...err.toJSON(), stack }, 500);
               }

               return c.json({ message: String(err), stack }, 500);
            } else {
               throw err;
            }
         }*/

         if (err instanceof Exception) {
            console.log("---is exception", err.code);
            return c.json(err.toJSON(), err.code as any);
         }

         return c.json({ error: err.message }, 500);
      });
      this.setBuilt();
   }

   /*setAdminHtml(html: string) {
      this.admin_html = html;
      const basepath = (String(this.config.admin.basepath) + "/").replace(/\/+$/, "/");

      const allowed_prefix = basepath + "auth";
      const login_path = basepath + "auth/login";

      this.client.get(basepath + "*", async (c, next) => {
         const path = new URL(c.req.url).pathname;
         if (!path.startsWith(allowed_prefix)) {
            console.log("guard check permissions");
            try {
               this.ctx.guard.throwUnlessGranted(SystemPermissions.admin);
            } catch (e) {
               return c.redirect(login_path);
            }
         }

         return c.html(this.admin_html!);
      });
   }

   getAdminHtml() {
      return this.admin_html;
   }*/

   override toJSON(secrets?: boolean) {
      return this.config;
   }
}
