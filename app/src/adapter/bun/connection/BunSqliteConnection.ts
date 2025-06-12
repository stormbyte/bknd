import type { Database } from "bun:sqlite";
import {
   buildQueryFn,
   GenericSqliteConnection,
   parseBigInt,
   type IGenericSqlite,
} from "data/connection/sqlite/GenericSqliteConnection";

export type BunSqliteConnectionConfig = {
   database: Database;
};

function bunSqliteExecutor(db: Database, cache: boolean): IGenericSqlite<Database> {
   const fn = cache ? "query" : "prepare";
   const getStmt = (sql: string) => db[fn](sql);

   return {
      db,
      query: buildQueryFn({
         all: (sql, parameters) => getStmt(sql).all(...(parameters || [])),
         run: (sql, parameters) => {
            const { changes, lastInsertRowid } = getStmt(sql).run(...(parameters || []));
            return {
               insertId: parseBigInt(lastInsertRowid),
               numAffectedRows: parseBigInt(changes),
            };
         },
      }),
      close: () => db.close(),
   };
}

export function bunSqlite(config: BunSqliteConnectionConfig) {
   return new GenericSqliteConnection(
      config.database,
      () => bunSqliteExecutor(config.database, false),
      {
         name: "bun-sqlite",
      },
   );
}
