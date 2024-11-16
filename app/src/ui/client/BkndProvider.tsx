import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ModuleConfigs, ModuleSchemas } from "../../modules";
import { useClient } from "./ClientProvider";
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
};

const BkndContext = createContext<BkndContext>(undefined!);
export type { TSchemaActions };

export function BkndProvider({
   includeSecrets = false,
   children
}: { includeSecrets?: boolean; children: any }) {
   const [withSecrets, setWithSecrets] = useState<boolean>(includeSecrets);
   const [schema, setSchema] = useState<BkndContext>();
   const client = useClient();

   async function fetchSchema(_includeSecrets: boolean = false) {
      if (withSecrets) return;
      const { body } = await client.api.system.readSchema({
         config: true,
         secrets: _includeSecrets
      });
      console.log("--schema fetched", body);
      setSchema(body as any);
      setWithSecrets(_includeSecrets);
   }

   async function requireSecrets() {
      if (withSecrets) return;
      await fetchSchema(true);
   }

   useEffect(() => {
      if (schema?.schema) return;
      fetchSchema(includeSecrets);
   }, []);

   if (!schema?.schema) return null;
   const app = new AppReduced(schema.config as any);

   const actions = getSchemaActions({ client, setSchema });

   return (
      <BkndContext.Provider value={{ ...schema, actions, requireSecrets, app }}>
         {children}
      </BkndContext.Provider>
   );
}

export function useBknd({ withSecrets }: { withSecrets?: boolean } = {}): BkndContext {
   const ctx = useContext(BkndContext);
   if (withSecrets) ctx.requireSecrets();

   return ctx;
}

/*
type UseSchemaForType<Key extends keyof ModuleSchemas> = {
   version: number;
   schema: ModuleSchemas[Key];
   config: ModuleConfigs[Key];
};

export function useSchemaFor<Key extends keyof ModuleConfigs>(module: Key): UseSchemaForType<Key> {
   //const app = useApp();
   const { version, schema, config } = useSchema();
   return {
      version,
      schema: schema[module],
      config: config[module]
   };
}*/
