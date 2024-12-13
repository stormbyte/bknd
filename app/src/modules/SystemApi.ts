import type { ConfigUpdateResponse } from "modules/server/SystemController";
import { ModuleApi } from "./ModuleApi";
import type { ModuleConfigs, ModuleKey, ModuleSchemas } from "./ModuleManager";

export type ApiSchemaResponse = {
   version: number;
   schema: ModuleSchemas;
   config: ModuleConfigs;
   permissions: string[];
};

export class SystemApi extends ModuleApi<any> {
   protected override getDefaultOptions(): Partial<any> {
      return {
         basepath: "/api/system"
      };
   }

   readSchema(options?: { config?: boolean; secrets?: boolean }) {
      return this.get<ApiSchemaResponse>("schema", {
         config: options?.config ? 1 : 0,
         secrets: options?.secrets ? 1 : 0
      });
   }

   setConfig<Module extends ModuleKey>(
      module: Module,
      value: ModuleConfigs[Module],
      force?: boolean
   ) {
      return this.post<ConfigUpdateResponse>(
         ["config", "set", module].join("/") + `?force=${force ? 1 : 0}`,
         value
      );
   }

   addConfig<Module extends ModuleKey>(module: Module, path: string, value: any) {
      return this.post<ConfigUpdateResponse>(["config", "add", module, path], value);
   }

   patchConfig<Module extends ModuleKey>(module: Module, path: string, value: any) {
      return this.patch<ConfigUpdateResponse>(["config", "patch", module, path], value);
   }

   overwriteConfig<Module extends ModuleKey>(module: Module, path: string, value: any) {
      return this.put<ConfigUpdateResponse>(["config", "overwrite", module, path], value);
   }

   removeConfig<Module extends ModuleKey>(module: Module, path: string) {
      return this.delete<ConfigUpdateResponse>(["config", "remove", module, path]);
   }
}
