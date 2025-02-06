import { IconAlertHexagon } from "@tabler/icons-react";
import type { ModuleConfigs, ModuleSchemas } from "modules";
import { getDefaultConfig, getDefaultSchema } from "modules/ModuleManager";
import { createContext, startTransition, useContext, useEffect, useRef, useState } from "react";
import { useApi } from "ui/client";
import { Button } from "ui/components/buttons/Button";
import { Alert } from "ui/components/display/Alert";
import { type TSchemaActions, getSchemaActions } from "./schema/actions";
import { AppReduced } from "./utils/AppReduced";

type BkndContext = {
   version: number;
   schema: ModuleSchemas;
   config: ModuleConfigs;
   permissions: string[];
   hasSecrets: boolean;
   requireSecrets: () => Promise<void>;
   actions: ReturnType<typeof getSchemaActions>;
   app: AppReduced;
   adminOverride?: ModuleConfigs["server"]["admin"];
};

const BkndContext = createContext<BkndContext>(undefined!);
export type { TSchemaActions };

enum Fetching {
   None = 0,
   Schema = 1,
   Secrets = 2
}

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
   const [error, setError] = useState<boolean>();
   const errorShown = useRef<boolean>();
   const fetching = useRef<Fetching>(Fetching.None);
   const [local_version, set_local_version] = useState(0);
   const api = useApi();

   async function reloadSchema() {
      await fetchSchema(includeSecrets, true);
   }

   async function fetchSchema(_includeSecrets: boolean = false, force?: boolean) {
      const requesting = withSecrets ? Fetching.Secrets : Fetching.Schema;
      if (fetching.current === requesting) return;

      if (withSecrets && !force) return;
      fetching.current = requesting;

      const res = await api.system.readSchema({
         config: true,
         secrets: _includeSecrets
      });

      if (!res.ok) {
         if (errorShown.current) return;
         errorShown.current = true;

         setError(true);
         // if already has schema, don't overwrite
         if (fetched && schema?.schema) return;
      } else if (error) {
         setError(false);
      }

      const newSchema = res.ok
         ? res.body
         : ({
              version: 0,
              schema: getDefaultSchema(),
              config: getDefaultConfig(),
              permissions: []
           } as any);

      if (adminOverride) {
         newSchema.config.server.admin = {
            ...newSchema.config.server.admin,
            ...adminOverride
         };
      }

      startTransition(() => {
         setSchema(newSchema);
         setWithSecrets(_includeSecrets);
         setFetched(true);
         set_local_version((v) => v + 1);
         fetching.current = Fetching.None;
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
   const hasSecrets = withSecrets && !error;

   return (
      <BkndContext.Provider
         value={{ ...schema, actions, requireSecrets, app, adminOverride, hasSecrets }}
         key={local_version}
      >
         {/*{error && (
            <Alert.Exception className="gap-2">
               <IconAlertHexagon />
               You attempted to load system configuration with secrets without having proper
               permission.
               <a href={schema.config.server.admin.basepath || "/"}>
                  <Button variant="red">Reload</Button>
               </a>
            </Alert.Exception>
         )}*/}

         {children}
      </BkndContext.Provider>
   );
}

export function useBknd({ withSecrets }: { withSecrets?: boolean } = {}): BkndContext {
   const ctx = useContext(BkndContext);
   if (withSecrets) ctx.requireSecrets();

   return ctx;
}
