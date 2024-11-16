import type { IssuerConfig } from "../OAuthStrategy";

type GoogleUserInfo = {
   sub: string;
   name: string;
   given_name: string;
   family_name: string;
   picture: string;
   email: string;
   email_verified: boolean;
   locale: string;
};

export const google: IssuerConfig<GoogleUserInfo> = {
   type: "oidc",
   client: {
      token_endpoint_auth_method: "client_secret_basic",
   },
   as: {
      issuer: "https://accounts.google.com",
   },
   profile: async (info) => {
      return {
         ...info,
         sub: info.sub,
         email: info.email,
      };
   },
};
