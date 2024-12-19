import { DataProvider, GlobalActionsProvider, usePlasmicCanvasContext } from "@plasmicapp/host";
import registerGlobalContext, {
   type GlobalContextMeta
} from "@plasmicapp/host/registerGlobalContext";
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

// @todo: it's an issue that we need auth, so we cannot make baseurl adjustable (maybe add an option to useAuth with a specific base url?)
export const BkndContext = ({
   children,
   baseUrl,
   initialAuth
}: React.PropsWithChildren<BkndContextProps>) => {
   const auth = useAuth();
   const baseurl = baseUrl ?? useBaseUrl();
   const api = useApi({ host: baseurl });

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

            /*const res = await fetch(`${baseurl}/api/system/config`);
            const result = (await res.json()) as BkndGlobalContextProps["appConfig"];*/
            console.log("appconfig", result);
            setData((prev) => ({ ...prev, appConfig: result }));
         }
      })();
   }, [inEditor]);

   const actions = useMemo(
      () => ({
         login: async (data: any) => {
            console.log("login", data);
            const result = await auth.login(data);
            console.log("login:result", result);
            if (result.res.ok && "user" in result.data) {
               //result.data.
               return result.data;
            } else {
               console.log("login failed", result);
            }

            return false;
         },
         register: async (data: any) => {
            console.log("register", data);
            const result = await auth.register(data);
            console.log("register:result", result);
            if (result.res.ok && "user" in result.data) {
               //result.data.
               return result.data;
            }

            return false;
         },
         logout: async () => {
            await auth.logout();
            console.log("logged out");
            return true;
         },
         setToken: auth.setToken
      }),
      [baseUrl]
   );

   console.log("plasmic.bknd.context", { baseUrl });
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
