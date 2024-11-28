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

   async readSchema(options?: { config?: boolean; secrets?: boolean }) {
      return await this.get<ApiSchemaResponse>("schema", {
         config: options?.config ? 1 : 0,
         secrets: options?.secrets ? 1 : 0
      });
   }

   async setConfig<Module extends ModuleKey>(
      module: Module,
      value: ModuleConfigs[Module],
      force?: boolean
   ) {
      return await this.post<any>(
         ["config", "set", module].join("/") + `?force=${force ? 1 : 0}`,
         value
      );
   }

   async addConfig<Module extends ModuleKey>(module: Module, path: string, value: any) {
      return await this.post<any>(["config", "add", module, path], value);
   }

   async patchConfig<Module extends ModuleKey>(module: Module, path: string, value: any) {
      return await this.patch<any>(["config", "patch", module, path], value);
   }

   async overwriteConfig<Module extends ModuleKey>(module: Module, path: string, value: any) {
      return await this.put<any>(["config", "overwrite", module, path], value);
   }

   async removeConfig<Module extends ModuleKey>(module: Module, path: string) {
      return await this.delete<any>(["config", "remove", module, path]);
   }
}
