import { type AppAuth, AuthPermissions, type SafeUser, type Strategy } from "auth";
import { TypeInvalidError, parse } from "core/utils";
import { DataPermissions } from "data";
import type { Hono } from "hono";
import { Controller } from "modules/Controller";
import type { ServerEnv } from "modules/Module";

export type AuthActionResponse = {
   success: boolean;
   action: string;
   data?: SafeUser;
   errors?: any;
};

export class AuthController extends Controller {
   constructor(private auth: AppAuth) {
      super();
   }

   get guard() {
      return this.auth.ctx.guard;
   }

   get em() {
      return this.auth.ctx.em;
   }

   get userRepo() {
      const entity_name = this.auth.config.entity_name;
      return this.em.repo(entity_name as "users");
   }

   private registerStrategyActions(strategy: Strategy, mainHono: Hono<ServerEnv>) {
      const actions = strategy.getActions?.();
      if (!actions) {
         return;
      }

      const { auth, permission } = this.middlewares;
      const hono = this.create().use(auth());

      const name = strategy.getName();
      const { create, change } = actions;
      const em = this.auth.em;

      if (create) {
         hono.post(
            "/create",
            permission([AuthPermissions.createUser, DataPermissions.entityCreate]),
            async (c) => {
               try {
                  const body = await this.auth.authenticator.getBody(c);
                  const valid = parse(create.schema, body, {
                     skipMark: true
                  });
                  const processed = (await create.preprocess?.(valid)) ?? valid;

                  // @todo: check processed for "role" and check permissions
                  const mutator = em.mutator(this.auth.config.entity_name as "users");
                  mutator.__unstable_toggleSystemEntityCreation(false);
                  const { data: created } = await mutator.insertOne({
                     ...processed,
                     strategy: name
                  });
                  mutator.__unstable_toggleSystemEntityCreation(true);

                  return c.json({
                     success: true,
                     action: "create",
                     strategy: name,
                     data: created as unknown as SafeUser
                  } as AuthActionResponse);
               } catch (e) {
                  if (e instanceof TypeInvalidError) {
                     return c.json(
                        {
                           success: false,
                           errors: e.errors
                        },
                        400
                     );
                  }
                  throw e;
               }
            }
         );
         hono.get("create/schema.json", async (c) => {
            return c.json(create.schema);
         });
      }

      mainHono.route(`/${name}/actions`, hono);
   }

   override getController() {
      const { auth } = this.middlewares;
      const hono = this.create();
      const strategies = this.auth.authenticator.getStrategies();

      for (const [name, strategy] of Object.entries(strategies)) {
         //console.log("registering", name, "at", `/${name}`);
         hono.route(`/${name}`, strategy.getController(this.auth.authenticator));
         this.registerStrategyActions(strategy, hono);
      }

      hono.get("/me", auth(), async (c) => {
         const claims = c.get("auth")?.user;
         if (claims) {
            const { data: user } = await this.userRepo.findId(claims.id);
            return c.json({ user });
         }

         return c.json({ user: null }, 403);
      });

      hono.get("/logout", auth(), async (c) => {
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

      return hono.all("*", (c) => c.notFound());
   }
}
