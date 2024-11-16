import type {
   KyselyPlugin,
   PluginTransformQueryArgs,
   PluginTransformResultArgs,
   QueryResult,
   RootOperationNode,
   UnknownRow,
} from "kysely";

type KeyValueObject = { [key: string]: any };

export class FilterNumericKeysPlugin implements KyselyPlugin {
   transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
      return args.node;
   }
   transformResult(args: PluginTransformResultArgs): Promise<QueryResult<UnknownRow>> {
      return Promise.resolve({
         ...args.result,
         rows: args.result.rows.map((row: KeyValueObject) => {
            const filteredObj: KeyValueObject = {};
            for (const key in row) {
               if (Number.isNaN(+key)) {
                  // Check if the key is not a number
                  filteredObj[key] = row[key];
               }
            }
            return filteredObj;
         }),
      });
   }
}
