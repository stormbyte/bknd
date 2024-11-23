import { AuthApi } from "auth/api/AuthApi";
import { DataApi } from "data/api/DataApi";
import { decodeJwt } from "jose";
import { MediaApi } from "media/api/MediaApi";
import { SystemApi } from "modules/SystemApi";

declare global {
   interface Window {
      __BKND__: {
         user?: any;
      };
   }
}

export type ApiOptions = {
   host: string;
   token?: string;
   storage?: "localStorage" | "manual";
   key?: string;
};

export class Api {
   private token?: string;
   private user?: object;
   private verified = false;

   public system!: SystemApi;
   public data!: DataApi;
   public auth!: AuthApi;
   public media!: MediaApi;

   constructor(private readonly options: ApiOptions) {
      if (options.token) {
         this.updateToken(options.token);
      } else {
         this.extractToken();
      }

      this.buildApis();
   }

   get tokenStorage() {
      return this.options.storage ?? "manual";
   }
   get tokenKey() {
      return this.options.key ?? "auth";
   }

   private extractToken() {
      if (this.tokenStorage === "localStorage") {
         const token = localStorage.getItem(this.tokenKey);
         if (token) {
            this.token = token;
            this.user = decodeJwt(token) as any;
         }
      } else {
         if (typeof window !== "undefined" && "__BKND__" in window) {
            this.user = window.__BKND__.user;
            this.verified = true;
         }
      }
   }

   updateToken(token?: string, rebuild?: boolean) {
      this.token = token;
      this.user = token ? (decodeJwt(token) as any) : undefined;

      if (this.tokenStorage === "localStorage") {
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

   getAuthState() {
      return {
         token: this.token,
         user: this.user,
         verified: this.verified
      };
   }

   private buildApis() {
      const baseParams = {
         host: this.options.host,
         token: this.token
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
