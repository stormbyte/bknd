import { Api } from "Api";
import type { AuthResponse } from "auth";
import type { AppAuthSchema } from "auth/auth-schema";
import type { ApiResponse } from "modules/ModuleApi";
import { useEffect, useState } from "react";
import {
   createClient,
   createOrUseClient,
   queryClient,
   useBaseUrl,
   useClient
} from "../../ClientProvider";

type LoginData = {
   email: string;
   password: string;
   [key: string]: any;
};

type UseAuth = {
   data: (AuthResponse & { verified: boolean }) | undefined;
   user: AuthResponse["user"] | undefined;
   token: AuthResponse["token"] | undefined;
   verified: boolean;
   login: (data: LoginData) => Promise<ApiResponse<AuthResponse>>;
   register: (data: LoginData) => Promise<ApiResponse<AuthResponse>>;
   logout: () => void;
   verify: () => void;
   setToken: (token: string) => void;
};

// @todo: needs to use a specific auth endpoint to get strategy information
export const useAuth = (options?: { baseUrl?: string }): UseAuth => {
   const ctxBaseUrl = useBaseUrl();
   //const client = useClient();
   const client = createOrUseClient(options?.baseUrl ? options?.baseUrl : ctxBaseUrl);
   const authState = client.auth().state();
   const [authData, setAuthData] = useState<UseAuth["data"]>(authState);
   const verified = authState?.verified ?? false;

   async function login(input: LoginData) {
      const res = await client.auth().login(input);
      if (res.res.ok && res.data && "user" in res.data) {
         setAuthData(res.data);
      }
      return res;
   }

   async function register(input: LoginData) {
      const res = await client.auth().register(input);
      if (res.res.ok && res.data && "user" in res.data) {
         setAuthData(res.data);
      }
      return res;
   }

   function setToken(token: string) {
      setAuthData(client.auth().setToken(token) as any);
   }

   async function logout() {
      await client.auth().logout();
      setAuthData(undefined);
      queryClient.clear();
   }

   async function verify() {
      await client.auth().verify();
      setAuthData(client.auth().state());
   }

   return {
      data: authData,
      user: authData?.user,
      token: authData?.token,
      verified,
      login,
      register,
      logout,
      setToken,
      verify
   };
};

type AuthStrategyData = Pick<AppAuthSchema, "strategies" | "basepath">;
export const useAuthStrategies = (options?: { baseUrl?: string }): Partial<AuthStrategyData> & {
   loading: boolean;
} => {
   const [data, setData] = useState<AuthStrategyData>();
   const ctxBaseUrl = useBaseUrl();
   const api = new Api({
      host: options?.baseUrl ? options?.baseUrl : ctxBaseUrl,
      tokenStorage: "localStorage"
   });

   useEffect(() => {
      (async () => {
         const res = await api.auth.strategies();
         console.log("res", res);
         if (res.res.ok) {
            setData(res.body);
         }
      })();
   }, [options?.baseUrl]);

   return { strategies: data?.strategies, basepath: data?.basepath, loading: !data };
};
