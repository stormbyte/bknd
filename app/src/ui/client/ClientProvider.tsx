import { Api, type ApiOptions, type TApiUser } from "Api";
import { createContext, useContext } from "react";

const ClientContext = createContext<{ baseUrl: string; api: Api }>({
   baseUrl: undefined
} as any);

export type ClientProviderProps = {
   children?: any;
   baseUrl?: string;
   user?: TApiUser | null | undefined;
};

export const ClientProvider = ({ children, baseUrl, user }: ClientProviderProps) => {
   const winCtx = useBkndWindowContext();
   const _ctx_baseUrl = useBaseUrl();
   let actualBaseUrl = baseUrl ?? _ctx_baseUrl ?? "";

   try {
      if (!baseUrl) {
         if (_ctx_baseUrl) {
            actualBaseUrl = _ctx_baseUrl;
            console.warn("wrapped many times, take from context", actualBaseUrl);
         } else if (typeof window !== "undefined") {
            actualBaseUrl = window.location.origin;
            console.log("setting from window", actualBaseUrl);
         }
      }
   } catch (e) {
      console.error("error .....", e);
   }

   console.log("api init", { host: actualBaseUrl, user: user ?? winCtx.user });
   const api = new Api({ host: actualBaseUrl, user: user ?? winCtx.user });

   return (
      <ClientContext.Provider value={{ baseUrl: api.baseUrl, api }}>
         {children}
      </ClientContext.Provider>
   );
};

export const useApi = (host?: ApiOptions["host"]): Api => {
   const context = useContext(ClientContext);
   if (!context?.api || (host && host.length > 0 && host !== context.baseUrl)) {
      return new Api({ host: host ?? "" });
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
