import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { TApiUser } from "Api";
import { createContext, useContext, useEffect, useState } from "react";
//import { useBkndWindowContext } from "ui/client/BkndProvider";
import { AppQueryClient } from "./utils/AppQueryClient";

const ClientContext = createContext<{ baseUrl: string; client: AppQueryClient }>({
   baseUrl: undefined
} as any);

export const queryClient = new QueryClient({
   defaultOptions: {
      queries: {
         retry: false,
         refetchOnWindowFocus: false
      }
   }
});

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

   //console.log("client provider11 with", { baseUrl, fallback: actualBaseUrl, user });
   const client = createClient(actualBaseUrl, user ?? winCtx.user);

   return (
      <QueryClientProvider client={queryClient}>
         <ClientContext.Provider value={{ baseUrl: actualBaseUrl, client }}>
            {children}
         </ClientContext.Provider>
      </QueryClientProvider>
   );
};

export function createClient(baseUrl: string, user?: object) {
   return new AppQueryClient(baseUrl, user);
}

export function createOrUseClient(baseUrl: string) {
   const context = useContext(ClientContext);
   if (!context) {
      console.warn("createOrUseClient returned a new client");
      return createClient(baseUrl);
   }

   return context.client;
}

export const useClient = () => {
   const context = useContext(ClientContext);
   if (!context) {
      throw new Error("useClient must be used within a ClientProvider");
   }

   console.log("useClient", context.baseUrl);
   return context.client;
};

export const useBaseUrl = () => {
   const context = useContext(ClientContext);
   return context.baseUrl;
};

type BkndWindowContext = {
   user?: object;
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
