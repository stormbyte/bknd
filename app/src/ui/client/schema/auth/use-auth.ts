import type { AuthState } from "Api";
import type { AuthResponse } from "auth";
import { useState } from "react";
import { useApi, useInvalidate } from "ui/client";

type LoginData = {
   email: string;
   password: string;
   [key: string]: any;
};

type UseAuth = {
   data: AuthState | undefined;
   user: AuthState["user"] | undefined;
   token: AuthState["token"] | undefined;
   verified: boolean;
   login: (data: LoginData) => Promise<AuthResponse>;
   register: (data: LoginData) => Promise<AuthResponse>;
   logout: () => void;
   verify: () => void;
   setToken: (token: string) => void;
};

export const useAuth = (options?: { baseUrl?: string }): UseAuth => {
   const api = useApi(options?.baseUrl);
   const invalidate = useInvalidate();
   const authState = api.getAuthState();
   const [authData, setAuthData] = useState<UseAuth["data"]>(authState);
   const verified = authState?.verified ?? false;

   function updateAuthState() {
      setAuthData(api.getAuthState());
   }

   async function login(input: LoginData) {
      const res = await api.auth.loginWithPassword(input);
      updateAuthState();
      return res.data;
   }

   async function register(input: LoginData) {
      const res = await api.auth.registerWithPassword(input);
      updateAuthState();
      return res.data;
   }

   function setToken(token: string) {
      api.updateToken(token);
      updateAuthState();
   }

   async function logout() {
      await api.updateToken(undefined);
      setAuthData(undefined);
      invalidate();
   }

   async function verify() {
      await api.verifyAuth();
      updateAuthState();
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
