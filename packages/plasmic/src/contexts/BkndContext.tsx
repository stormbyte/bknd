import {
   DataProvider,
   GlobalActionsProvider,
   type GlobalContextMeta,
   registerGlobalContext,
   usePlasmicCanvasContext
} from "@plasmicapp/host";
import type { AppConfig } from "bknd";
// @ts-ignore
import { ClientProvider, useApi, useAuth, useBaseUrl } from "bknd/client";
// biome-ignore lint/style/useImportType: <explanation>
import React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

// Users will be able to set these props in Studio.
interface BkndGlobalContextProps {
   // You might use this to override the auth URL to a test or local URL.
   baseUrl?: string;
   appConfig?: AppConfig;
   auth: any; // @todo: add typings
}

type BkndContextProps = {
   baseUrl?: string;
   initialAuth?: any;
};

const BkndContextContext = createContext<BkndGlobalContextProps>({} as any);

export const BkndContext = ({
   children,
   baseUrl,
   initialAuth
}: React.PropsWithChildren<BkndContextProps>) => {
   const auth = useAuth();
   const baseurl = baseUrl ?? useBaseUrl();
   const api = useApi(baseurl);

   const [data, setData] = useState<BkndGlobalContextProps>({
      baseUrl: baseurl,
      auth: auth ?? initialAuth,
      appConfig: undefined
   });
   const inEditor = !!usePlasmicCanvasContext();

   useEffect(() => {
      setData((prev) => ({ ...prev, auth: auth }));
   }, [auth.user]);

   useEffect(() => {
      (async () => {
         if (inEditor) {
            const result = await api.system.readConfig();
            setData((prev) => ({ ...prev, appConfig: result }));
         }
      })();
   }, [inEditor]);

   const actions = useMemo(
      () => ({
         login: auth.login,
         register: auth.register,
         logout: auth.logout,
         setToken: auth.setToken
      }),
      [baseUrl]
   );

   console.log("plasmic.bknd.context", { baseurl });
   return (
      <GlobalActionsProvider contextName="BkndContext" actions={actions}>
         <BkndContextContext.Provider value={data}>
            <DataProvider name="bknd" data={data}>
               <ClientProvider baseUrl={data.baseUrl}>{children}</ClientProvider>
            </DataProvider>
         </BkndContextContext.Provider>
      </GlobalActionsProvider>
   );
};

export function usePlasmicBkndContext() {
   const context = useContext(BkndContextContext);
   return context;
}

export function registerBkndContext(
   loader?: { registerGlobalContext: typeof registerGlobalContext },
   customMeta?: GlobalContextMeta<BkndContextProps>
) {
   if (loader) {
      loader.registerGlobalContext(BkndContext, customMeta ?? BkndContextMeta);
   } else {
      registerGlobalContext(BkndContext, customMeta ?? BkndContextMeta);
   }
}

export const BkndContextMeta: GlobalContextMeta<BkndContextProps> = {
   name: "BkndContext",
   importPath: "@bknd/plasmic",
   props: { baseUrl: { type: "string" }, initialAuth: { type: "object" } },
   providesData: true,
   globalActions: {
      login: {
         parameters: [{ name: "data", type: "object" }]
      },
      register: {
         parameters: [{ name: "data", type: "object" }]
      },
      logout: {
         parameters: []
      },
      setToken: {
         parameters: [{ name: "token", type: "string" }]
      },
      sayHi: {
         parameters: [{ name: "message", type: "string" }]
      }
   }
};
