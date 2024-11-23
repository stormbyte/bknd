import { Exception } from "core";
import { addFlashMessage } from "core/server/flash";
import { type Static, type TSchema, Type, parse, randomString, transformObject } from "core/utils";
import type { Context, Hono } from "hono";
import { deleteCookie, getSignedCookie, setSignedCookie } from "hono/cookie";
import { type JWTVerifyOptions, SignJWT, jwtVerify } from "jose";

type Input = any; // workaround

// @todo: add schema to interface to ensure proper inference
export interface Strategy {
   getController: (auth: Authenticator) => Hono<any>;
   getType: () => string;
   getMode: () => "form" | "external";
   getName: () => string;
   toJSON: (secrets?: boolean) => any;
}

export type User = {
   id: number;
   email: string;
   username: string;
   password: string;
   role: string;
};

export type ProfileExchange = {
   email?: string;
   username?: string;
   sub?: string;
   password?: string;
   [key: string]: any;
};

export type SafeUser = Omit<User, "password">;
export type CreateUser = Pick<User, "email"> & { [key: string]: any };
export type AuthResponse = { user: SafeUser; token: string };

export interface UserPool<Fields = "id" | "email" | "username"> {
   findBy: (prop: Fields, value: string | number) => Promise<User | undefined>;
   create: (user: CreateUser) => Promise<User | undefined>;
}

export const jwtConfig = Type.Object(
   {
      // @todo: autogenerate a secret if not present. But it must be persisted from AppAuth
      secret: Type.String({ default: "" }),
      alg: Type.Optional(Type.String({ enum: ["HS256"], default: "HS256" })),
      expiresIn: Type.Optional(Type.String()),
      issuer: Type.Optional(Type.String()),
      fields: Type.Array(Type.String(), { default: ["id", "email", "role"] })
   },
   {
      default: {},
      additionalProperties: false
   }
);
export const authenticatorConfig = Type.Object({
   jwt: jwtConfig
});

type AuthConfig = Static<typeof authenticatorConfig>;
export type AuthAction = "login" | "register";
export type AuthUserResolver = (
   action: AuthAction,
   strategy: Strategy,
   identifier: string,
   profile: ProfileExchange
) => Promise<SafeUser | undefined>;

export class Authenticator<Strategies extends Record<string, Strategy> = Record<string, Strategy>> {
   private readonly strategies: Strategies;
   private readonly config: AuthConfig;
   private _user: SafeUser | undefined;
   private readonly userResolver: AuthUserResolver;

   constructor(strategies: Strategies, userResolver?: AuthUserResolver, config?: AuthConfig) {
      this.userResolver = userResolver ?? (async (a, s, i, p) => p as any);
      this.strategies = strategies as Strategies;
      this.config = parse(authenticatorConfig, config ?? {});
   }

   async resolve(
      action: AuthAction,
      strategy: Strategy,
      identifier: string,
      profile: ProfileExchange
   ): Promise<AuthResponse> {
      //console.log("resolve", { action, strategy: strategy.getName(), profile });
      const user = await this.userResolver(action, strategy, identifier, profile);

      if (user) {
         return {
            user,
            token: await this.jwt(user)
         };
      }

      throw new Error("User could not be resolved");
   }

   getStrategies(): Strategies {
      return this.strategies;
   }

   isUserLoggedIn(): boolean {
      return this._user !== undefined;
   }

   getUser() {
      return this._user;
   }

   // @todo: determine what to do exactly
   __setUserNull() {
      this._user = undefined;
   }

   strategy<
      StrategyName extends keyof Strategies,
      Strat extends Strategy = Strategies[StrategyName]
   >(strategy: StrategyName): Strat {
      try {
         return this.strategies[strategy] as unknown as Strat;
      } catch (e) {
         throw new Error(`Strategy "${String(strategy)}" not found`);
      }
   }

   async jwt(user: Omit<User, "password">): Promise<string> {
      const prohibited = ["password"];
      for (const prop of prohibited) {
         if (prop in user) {
            throw new Error(`Property "${prop}" is prohibited`);
         }
      }

      const jwt = new SignJWT(user)
         .setProtectedHeader({ alg: this.config.jwt?.alg ?? "HS256" })
         .setIssuedAt();

      if (this.config.jwt?.issuer) {
         jwt.setIssuer(this.config.jwt.issuer);
      }

      if (this.config.jwt?.expiresIn) {
         jwt.setExpirationTime(this.config.jwt.expiresIn);
      }

      return jwt.sign(new TextEncoder().encode(this.config.jwt?.secret ?? ""));
   }

   async verify(jwt: string): Promise<boolean> {
      const options: JWTVerifyOptions = {
         algorithms: [this.config.jwt?.alg ?? "HS256"]
      };

      if (this.config.jwt?.issuer) {
         options.issuer = this.config.jwt.issuer;
      }

      if (this.config.jwt?.expiresIn) {
         options.maxTokenAge = this.config.jwt.expiresIn;
      }

      try {
         const { payload } = await jwtVerify<User>(
            jwt,
            new TextEncoder().encode(this.config.jwt?.secret ?? ""),
            options
         );
         this._user = payload;
         return true;
      } catch (e) {
         this._user = undefined;
         //console.error(e);
      }

      return false;
   }

   // @todo: CookieOptions not exported from hono
   private get cookieOptions(): any {
      return {
         path: "/",
         sameSite: "lax",
         httpOnly: true
      };
   }

   private async getAuthCookie(c: Context): Promise<string | undefined> {
      const secret = this.config.jwt.secret;

      const token = await getSignedCookie(c, secret, "auth");
      if (typeof token !== "string") {
         await deleteCookie(c, "auth", this.cookieOptions);
         return undefined;
      }

      return token;
   }

   private async setAuthCookie(c: Context, token: string) {
      const secret = this.config.jwt.secret;
      await setSignedCookie(c, "auth", token, secret, this.cookieOptions);
   }

   async logout(c: Context) {
      const cookie = await this.getAuthCookie(c);
      if (cookie) {
         await deleteCookie(c, "auth", this.cookieOptions);
         await addFlashMessage(c, "Signed out", "info");
      }
   }

   isJsonRequest(c: Context): boolean {
      //return c.req.header("Content-Type") === "application/x-www-form-urlencoded";
      return c.req.header("Content-Type") === "application/json";
   }

   async respond(c: Context, data: AuthResponse | Error | any, redirect?: string) {
      if (this.isJsonRequest(c)) {
         return c.json(data);
      }

      const referer = new URL(redirect ?? c.req.header("Referer") ?? "/");

      if ("token" in data) {
         await this.setAuthCookie(c, data.token);
         return c.redirect("/");
      }

      let message = "An error occured";
      if (data instanceof Exception) {
         message = data.message;
      }

      await addFlashMessage(c, message, "error");
      return c.redirect(referer);
   }

   // @todo: don't extract user from token, but from the database or cache
   async resolveAuthFromRequest(c: Context): Promise<SafeUser | undefined> {
      let token: string | undefined;
      if (c.req.raw.headers.has("Authorization")) {
         const bearerHeader = String(c.req.header("Authorization"));
         token = bearerHeader.replace("Bearer ", "");
      } else {
         token = await this.getAuthCookie(c);
      }

      if (token) {
         await this.verify(token);
         return this._user;
      }

      return undefined;
   }

   toJSON(secrets?: boolean) {
      return {
         ...this.config,
         jwt: secrets ? this.config.jwt : undefined,
         strategies: transformObject(this.getStrategies(), (s) => s.toJSON(secrets))
      };
   }
}
