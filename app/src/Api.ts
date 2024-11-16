import { AuthApi } from "auth/api/AuthApi";
import { DataApi } from "data/api/DataApi";
import { decodeJwt } from "jose";
import { MediaApi } from "media/api/MediaApi";
import { SystemApi } from "modules/SystemApi";

export type ApiOptions = {
   host: string;
   token?: string;
   tokenStorage?: "localStorage";
   localStorage?: {
      key?: string;
   };
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

   private extractToken() {
      if (this.options.tokenStorage === "localStorage") {
         const key = this.options.localStorage?.key ?? "auth";
         const raw = localStorage.getItem(key);

         if (raw) {
            const { token } = JSON.parse(raw);
            this.token = token;
            this.user = decodeJwt(token) as any;
         }
      }
   }

   updateToken(token?: string, rebuild?: boolean) {
      this.token = token;
      this.user = token ? (decodeJwt(token) as any) : undefined;

      if (this.options.tokenStorage === "localStorage") {
         const key = this.options.localStorage?.key ?? "auth";

         if (token) {
            localStorage.setItem(key, JSON.stringify({ token }));
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
      if (!this.token) return;

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
