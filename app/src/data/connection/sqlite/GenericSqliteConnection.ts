import type { KyselyPlugin } from "kysely";
import {
   type IGenericSqlite,
   type OnCreateConnection,
   type Promisable,
   parseBigInt,
   buildQueryFn,
   GenericSqliteDialect,
} from "kysely-generic-sqlite";
import { SqliteConnection } from "./SqliteConnection";

export type GenericSqliteConnectionConfig = {
   name: string;
   additionalPlugins?: KyselyPlugin[];
   excludeTables?: string[];
   onCreateConnection?: OnCreateConnection;
};

export { parseBigInt, buildQueryFn, GenericSqliteDialect, type IGenericSqlite };

export class GenericSqliteConnection<DB = unknown> extends SqliteConnection<DB> {
   override name = "generic-sqlite";

   constructor(
      db: DB,
      executor: () => Promisable<IGenericSqlite>,
      config?: GenericSqliteConnectionConfig,
   ) {
      super({
         dialect: GenericSqliteDialect,
         dialectArgs: [executor, config?.onCreateConnection],
         additionalPlugins: config?.additionalPlugins,
         excludeTables: config?.excludeTables,
      });
      this.client = db;
   }
}
