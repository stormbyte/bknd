import { ModuleApi } from "./ModuleApi";
import type { ModuleConfigs, ModuleSchemas } from "./ModuleManager";

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
}
