import { type NotificationData, notifications } from "@mantine/notifications";
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

   async function displayError(action: string, module: string, res: Response, path?: string) {
      const notification_data: NotificationData = {
         id: "schema-error-" + [action, module, path].join("-"),
         title: `Config update failed${path ? ": " + path : ""}`,
         message: "Failed to complete config update",
         color: "red",
         position: "top-right",
         withCloseButton: true,
         autoClose: false
      };
      try {
         const { error } = (await res.json()) as any;
         notifications.show({ ...notification_data, message: error });
      } catch (e) {
         notifications.show(notification_data);
      }
   }

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
         } else {
            await displayError("set", module, res);
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
         } else {
            await displayError("patch", module, res, path);
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
         } else {
            await displayError("overwrite", module, res, path);
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
         } else {
            await displayError("add", module, res, path);
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
         } else {
            await displayError("remove", module, res, path);
         }

         return false;
      }
   };
}
