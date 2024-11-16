import type { AppAuthSchema, AppAuthStrategies } from "auth/auth-schema";
import type { AuthResponse, SafeUser, Strategy } from "auth/authenticate/Authenticator";
import { type BaseModuleApiOptions, ModuleApi } from "modules/ModuleApi";

export type AuthApiOptions = BaseModuleApiOptions & {
   onTokenUpdate?: (token: string) => void | Promise<void>;
};

export class AuthApi extends ModuleApi<AuthApiOptions> {
   protected override getDefaultOptions(): Partial<AuthApiOptions> {
      return {
         basepath: "/api/auth"
      };
   }

   async loginWithPassword(input: any) {
      const res = await this.post<AuthResponse>(["password", "login"], input);
      if (res.res.ok && res.body.token) {
         await this.options.onTokenUpdate?.(res.body.token);
      }
      return res;
   }

   async registerWithPassword(input: any) {
      const res = await this.post<AuthResponse>(["password", "register"], input);
      if (res.res.ok && res.body.token) {
         await this.options.onTokenUpdate?.(res.body.token);
      }
      return res;
   }

   async me() {
      return this.get<{ user: SafeUser | null }>(["me"]);
   }

   async strategies() {
      return this.get<{ strategies: AppAuthSchema["strategies"] }>(["strategies"]);
   }

   async logout() {}
}
