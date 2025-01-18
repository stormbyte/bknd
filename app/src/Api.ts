import type { SafeUser } from "auth";
import { AuthApi } from "auth/api/AuthApi";
import { DataApi } from "data/api/DataApi";
import { decode } from "hono/jwt";
import { omit } from "lodash-es";
import { MediaApi } from "media/api/MediaApi";
import { SystemApi } from "modules/SystemApi";

export type TApiUser = SafeUser;

declare global {
   interface Window {
      __BKND__: {
         user?: TApiUser;
      };
   }
}

export type ApiOptions = {
   host: string;
   user?: TApiUser;
   token?: string;
   headers?: Headers;
   key?: string;
   localStorage?: boolean;
};

export type AuthState = {
   token?: string;
   user?: TApiUser;
   verified: boolean;
};

export class Api {
   private token?: string;
   private user?: TApiUser;
   private verified = false;
   private token_transport: "header" | "cookie" | "none" = "header";

   public system!: SystemApi;
   public data!: DataApi;
   public auth!: AuthApi;
   public media!: MediaApi;

   constructor(private readonly options: ApiOptions) {
      if (options.user) {
         this.user = options.user;
         this.token_transport = "none";
         this.verified = true;
      } else if (options.token) {
         this.token_transport = "header";
         this.updateToken(options.token);
      } else {
         this.extractToken();
      }

      this.buildApis();
   }

   get baseUrl() {
      return this.options.host;
   }

   get tokenKey() {
      return this.options.key ?? "auth";
   }

   private extractToken() {
      if (this.options.headers) {
         // try cookies
         const cookieToken = getCookieValue(this.options.headers.get("cookie"), "auth");
         if (cookieToken) {
            this.updateToken(cookieToken);
            this.token_transport = "cookie";
            this.verified = true;
            return;
         }

         // try authorization header
         const headerToken = this.options.headers.get("authorization")?.replace("Bearer ", "");
         if (headerToken) {
            this.token_transport = "header";
            this.updateToken(headerToken);
            return;
         }
      } else if (this.options.localStorage) {
         const token = localStorage.getItem(this.tokenKey);
         if (token) {
            this.token_transport = "header";
            this.updateToken(token);
         }
      }

      //console.warn("Couldn't extract token");
   }

   updateToken(token?: string, rebuild?: boolean) {
      this.token = token;
      if (token) {
         this.user = omit(decode(token).payload as any, ["iat", "iss", "exp"]) as any;
      } else {
         this.user = undefined;
      }

      if (this.options.localStorage) {
         const key = this.tokenKey;

         if (token) {
            localStorage.setItem(key, token);
         } else {
            localStorage.removeItem(key);
         }
      }

      if (rebuild) this.buildApis();
   }

   markAuthVerified(verfied: boolean) {
      this.verified = verfied;
      return this;
   }

   getAuthState(): AuthState {
      return {
         token: this.token,
         user: this.user,
         verified: this.verified
      };
   }

   async getVerifiedAuthState(): Promise<AuthState> {
      await this.verifyAuth();
      return this.getAuthState();
   }

   async verifyAuth() {
      if (!this.token) {
         this.markAuthVerified(false);
         return;
      }

      try {
         const res = await this.auth.me();
         if (!res.ok || !res.body.user) {
            throw new Error();
         }

         this.markAuthVerified(true);
      } catch (e) {
         this.markAuthVerified(false);
         this.updateToken(undefined);
      }
   }

   getUser(): TApiUser | null {
      return this.user || null;
   }

   private buildApis() {
      const baseParams = {
         host: this.options.host,
         token: this.token,
         headers: this.options.headers,
         token_transport: this.token_transport
      };

      this.system = new SystemApi(baseParams);
      this.data = new DataApi(baseParams);
      this.auth = new AuthApi({
         ...baseParams,
         onTokenUpdate: (token) => this.updateToken(token, true)
      });
      this.media = new MediaApi(baseParams);
   }
}

function getCookieValue(cookies: string | null, name: string) {
   if (!cookies) return null;

   for (const cookie of cookies.split("; ")) {
      const [key, value] = cookie.split("=");
      if (key === name && value) {
         return decodeURIComponent(value);
      }
   }
   return null;
}
