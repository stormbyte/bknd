import { Api, type ApiOptions, type TApiUser } from "Api";
import { createContext, useContext, useEffect, useState } from "react";

const ClientContext = createContext<{ baseUrl: string; api: Api }>({
   baseUrl: undefined
} as any);

export type ClientProviderProps = {
   children?: any;
   baseUrl?: string;
   user?: TApiUser | null | undefined;
};

export const ClientProvider = ({ children, baseUrl, user }: ClientProviderProps) => {
   const [actualBaseUrl, setActualBaseUrl] = useState<string | null>(null);
   const winCtx = useBkndWindowContext();

   try {
      const _ctx_baseUrl = useBaseUrl();
      if (_ctx_baseUrl) {
         console.warn("wrapped many times");
         setActualBaseUrl(_ctx_baseUrl);
      }
   } catch (e) {
      console.error("error", e);
   }

   useEffect(() => {
      // Only set base URL if running on the client side
      if (typeof window !== "undefined") {
         setActualBaseUrl(baseUrl || window.location.origin);
      }
   }, [baseUrl]);

   if (!actualBaseUrl) {
      // Optionally, return a fallback during SSR rendering
      return null; // or a loader/spinner if desired
   }

   const api = new Api({ host: actualBaseUrl, user: user ?? winCtx.user });

   return (
      <ClientContext.Provider value={{ baseUrl: actualBaseUrl, api }}>
         {children}
      </ClientContext.Provider>
   );
};

export const useApi = (host?: ApiOptions["host"]) => {
   const context = useContext(ClientContext);
   if (host && host !== context.baseUrl) {
      return new Api({ host });
   }

   return context.api;
};

/**
 * @deprecated use useApi().baseUrl instead
 */
export const useBaseUrl = () => {
   const context = useContext(ClientContext);
   return context.baseUrl;
};

type BkndWindowContext = {
   user?: TApiUser;
   logout_route: string;
};
export function useBkndWindowContext(): BkndWindowContext {
   if (typeof window !== "undefined" && window.__BKND__) {
      return window.__BKND__ as any;
   } else {
      return {
         logout_route: "/api/auth/logout"
      };
   }
}
