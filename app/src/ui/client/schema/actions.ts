import { set } from "lodash-es";
import type { ModuleConfigs } from "../../../modules";
import type { AppQueryClient } from "../utils/AppQueryClient";

export type SchemaActionsProps = {
   client: AppQueryClient;
   setSchema: React.Dispatch<React.SetStateAction<any>>;
};

export type TSchemaActions = ReturnType<typeof getSchemaActions>;

export function getSchemaActions({ client, setSchema }: SchemaActionsProps) {
   const baseUrl = client.baseUrl;
   const token = client.auth().state()?.token;
   return {
      set: async <Module extends keyof ModuleConfigs>(
         module: keyof ModuleConfigs,
         value: ModuleConfigs[Module],
         force?: boolean
      ) => {
         const res = await fetch(
            `${baseUrl}/api/system/config/set/${module}?force=${force ? 1 : 0}`,
            {
               method: "POST",
               headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`
               },
               body: JSON.stringify(value)
            }
         );
         if (res.ok) {
            const data = (await res.json()) as any;
            console.log("update config set", module, data);
            if (data.success) {
               setSchema((prev) => {
                  if (!prev) return prev;
                  return {
                     ...prev,
                     config: {
                        ...prev.config,
                        [module]: data.config
                     }
                  };
               });
            }

            return data.success;
         }

         return false;
      },
      patch: async <Module extends keyof ModuleConfigs>(
         module: keyof ModuleConfigs,
         path: string,
         value: any
      ): Promise<boolean> => {
         const res = await fetch(`${baseUrl}/api/system/config/patch/${module}/${path}`, {
            method: "PATCH",
            headers: {
               "Content-Type": "application/json",
               Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(value)
         });
         if (res.ok) {
            const data = (await res.json()) as any;
            console.log("update config patch", module, path, data);
            if (data.success) {
               setSchema((prev) => {
                  if (!prev) return prev;
                  return {
                     ...prev,
                     config: {
                        ...prev.config,
                        [module]: data.config
                     }
                  };
               });
            }

            return data.success;
         }

         return false;
      },
      overwrite: async <Module extends keyof ModuleConfigs>(
         module: keyof ModuleConfigs,
         path: string,
         value: any
      ) => {
         const res = await fetch(`${baseUrl}/api/system/config/overwrite/${module}/${path}`, {
            method: "PUT",
            headers: {
               "Content-Type": "application/json",
               Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(value)
         });
         if (res.ok) {
            const data = (await res.json()) as any;
            console.log("update config overwrite", module, path, data);
            if (data.success) {
               setSchema((prev) => {
                  if (!prev) return prev;
                  return {
                     ...prev,
                     config: {
                        ...prev.config,
                        [module]: data.config
                     }
                  };
               });
            }

            return data.success;
         }

         return false;
      },
      add: async <Module extends keyof ModuleConfigs>(
         module: keyof ModuleConfigs,
         path: string,
         value: any
      ) => {
         const res = await fetch(`${baseUrl}/api/system/config/add/${module}/${path}`, {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
               Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(value)
         });
         if (res.ok) {
            const data = (await res.json()) as any;
            console.log("update config add", module, data);

            if (data.success) {
               setSchema((prev) => {
                  if (!prev) return prev;
                  return {
                     ...prev,
                     config: {
                        ...prev.config,
                        [module]: data.config
                     }
                  };
               });
            }

            return data.success;
         }

         return false;
      },
      remove: async <Module extends keyof ModuleConfigs>(
         module: keyof ModuleConfigs,
         path: string
      ) => {
         const res = await fetch(`${baseUrl}/api/system/config/remove/${module}/${path}`, {
            method: "DELETE",
            headers: {
               "Content-Type": "application/json",
               Authorization: `Bearer ${token}`
            }
         });
         if (res.ok) {
            const data = (await res.json()) as any;
            console.log("update config remove", module, data);

            if (data.success) {
               setSchema((prev) => {
                  if (!prev) return prev;
                  return {
                     ...prev,
                     config: {
                        ...prev.config,
                        [module]: data.config
                     }
                  };
               });
            }

            return data.success;
         }

         return false;
      }
   };
}
