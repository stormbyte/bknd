import type { ModuleConfigs, ModuleSchemas } from "modules";
import { getDefaultConfig, getDefaultSchema } from "modules/ModuleManager";
import { createContext, startTransition, useContext, useEffect, useRef, useState } from "react";
import { useApi } from "ui/client";
import { type TSchemaActions, getSchemaActions } from "./schema/actions";
import { AppReduced } from "./utils/AppReduced";

type BkndContext = {
   version: number;
   schema: ModuleSchemas;
   config: ModuleConfigs;
   permissions: string[];
   requireSecrets: () => Promise<void>;
   actions: ReturnType<typeof getSchemaActions>;
   app: AppReduced;
   adminOverride?: ModuleConfigs["server"]["admin"];
};

const BkndContext = createContext<BkndContext>(undefined!);
export type { TSchemaActions };

export function BkndProvider({
   includeSecrets = false,
   adminOverride,
   children,
   fallback = null
}: { includeSecrets?: boolean; children: any; fallback?: React.ReactNode } & Pick<
   BkndContext,
   "adminOverride"
>) {
   const [withSecrets, setWithSecrets] = useState<boolean>(includeSecrets);
   const [schema, setSchema] =
      useState<Pick<BkndContext, "version" | "schema" | "config" | "permissions">>();
   const [fetched, setFetched] = useState(false);
   const errorShown = useRef<boolean>();
   const api = useApi();

   async function reloadSchema() {
      await fetchSchema(includeSecrets, true);
   }

   async function fetchSchema(_includeSecrets: boolean = false, force?: boolean) {
      if (withSecrets && !force) return;
      const res = await api.system.readSchema({
         config: true,
         secrets: _includeSecrets
      });

      if (!res.ok) {
         if (errorShown.current) return;
         errorShown.current = true;
         /*notifications.show({
            title: "Failed to fetch schema",
            // @ts-ignore
            message: body.error,
            color: "red",
            position: "top-right",
            autoClose: false,
            withCloseButton: true
         });*/
      }

      const schema = res.ok
         ? res.body
         : ({
              version: 0,
              schema: getDefaultSchema(),
              config: getDefaultConfig(),
              permissions: []
           } as any);

      if (adminOverride) {
         schema.config.server.admin = {
            ...schema.config.server.admin,
            ...adminOverride
         };
      }

      startTransition(() => {
         setSchema(schema);
         setWithSecrets(_includeSecrets);
         setFetched(true);
      });
   }

   async function requireSecrets() {
      if (withSecrets) return;
      await fetchSchema(true);
   }

   useEffect(() => {
      if (schema?.schema) return;
      fetchSchema(includeSecrets);
   }, []);

   if (!fetched || !schema) return fallback;
   const app = new AppReduced(schema?.config as any);
   const actions = getSchemaActions({ api, setSchema, reloadSchema });

   return (
      <BkndContext.Provider value={{ ...schema, actions, requireSecrets, app, adminOverride }}>
         {children}
      </BkndContext.Provider>
   );
}

export function useBknd({ withSecrets }: { withSecrets?: boolean } = {}): BkndContext {
   const ctx = useContext(BkndContext);
   if (withSecrets) ctx.requireSecrets();

   return ctx;
}
