import type { KyselyPlugin, UnknownRow } from "kysely";

// @todo: add test
export class KyselyPluginRunner {
   protected plugins: Set<KyselyPlugin>;

   constructor(plugins: KyselyPlugin[] = []) {
      this.plugins = new Set(plugins);
   }

   async transformResultRows<T>(rows: T[]): Promise<T[]> {
      let copy = rows;
      for (const plugin of this.plugins) {
         const res = await plugin.transformResult({
            queryId: "1" as any,
            result: { rows: copy as UnknownRow[] },
         });
         copy = res.rows as T[];
      }

      return copy as T[];
   }
}
