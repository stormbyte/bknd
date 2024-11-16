import type {
   KyselyPlugin,
   PluginTransformQueryArgs,
   PluginTransformResultArgs,
   QueryResult,
   RootOperationNode,
   UnknownRow,
} from "kysely";

type KeyValueObject = { [key: string]: any };

export class DeserializeJsonValuesPlugin implements KyselyPlugin {
   transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
      return args.node;
   }
   transformResult(
      args: PluginTransformResultArgs
   ): Promise<QueryResult<UnknownRow>> {
      return Promise.resolve({
         ...args.result,
         rows: args.result.rows.map((row: KeyValueObject) => {
            const result: KeyValueObject = {};
            for (const key in row) {
               try {
                  // Attempt to parse the value as JSON
                  result[key] = JSON.parse(row[key]);
               } catch (error) {
                  // If parsing fails, keep the original value
                  result[key] = row[key];
               }
            }
            return result;
         }),
      });
   }
}
