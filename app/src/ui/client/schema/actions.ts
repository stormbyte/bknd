import { type NotificationData, notifications } from "@mantine/notifications";
import { ucFirst } from "core/utils";
import type { ApiResponse, ModuleConfigs } from "../../../modules";
import type { AppQueryClient } from "../utils/AppQueryClient";

export type SchemaActionsProps = {
   client: AppQueryClient;
   setSchema: React.Dispatch<React.SetStateAction<any>>;
};

export type TSchemaActions = ReturnType<typeof getSchemaActions>;

export function getSchemaActions({ client, setSchema }: SchemaActionsProps) {
   const api = client.api;

   async function handleConfigUpdate(
      action: string,
      module: string,
      res: ApiResponse,
      path?: string
   ): Promise<boolean> {
      const base: Partial<NotificationData> = {
         id: "schema-" + [action, module, path].join("-"),
         position: "top-right",
         autoClose: 3000
      };

      if (res.res.ok && res.body.success) {
         console.log("update config", action, module, path, res.body);
         if (res.body.success) {
            setSchema((prev) => {
               if (!prev) return prev;
               return {
                  ...prev,
                  config: {
                     ...prev.config,
                     [module]: res.body.config
                  }
               };
            });
         }

         notifications.show({
            ...base,
            title: `Config updated: ${ucFirst(module)}`,
            color: "blue",
            message: `Operation ${action.toUpperCase()} at ${module}${path ? "." + path : ""}`
         });
         return true;
      }

      notifications.show({
         ...base,
         title: `Config Update failed: ${ucFirst(module)}${path ? "." + path : ""}`,
         color: "red",
         withCloseButton: true,
         autoClose: false,
         message: res.body.error ?? "Failed to complete config update"
      });
      return false;
   }

   return {
      set: async <Module extends keyof ModuleConfigs>(
         module: keyof ModuleConfigs,
         value: ModuleConfigs[Module],
         force?: boolean
      ) => {
         const res = await api.system.setConfig(module, value, force);
         return await handleConfigUpdate("set", module, res);
      },
      patch: async <Module extends keyof ModuleConfigs>(
         module: keyof ModuleConfigs,
         path: string,
         value: any
      ): Promise<boolean> => {
         const res = await api.system.patchConfig(module, path, value);
         return await handleConfigUpdate("patch", module, res, path);
      },
      overwrite: async <Module extends keyof ModuleConfigs>(
         module: keyof ModuleConfigs,
         path: string,
         value: any
      ) => {
         const res = await api.system.overwriteConfig(module, path, value);
         return await handleConfigUpdate("overwrite", module, res, path);
      },
      add: async <Module extends keyof ModuleConfigs>(
         module: keyof ModuleConfigs,
         path: string,
         value: any
      ) => {
         const res = await api.system.addConfig(module, path, value);
         return await handleConfigUpdate("add", module, res, path);
      },
      remove: async <Module extends keyof ModuleConfigs>(
         module: keyof ModuleConfigs,
         path: string
      ) => {
         const res = await api.system.removeConfig(module, path);
         return await handleConfigUpdate("remove", module, res, path);
      }
   };
}
