import {
   buildQueryFn,
   GenericSqliteConnection,
   parseBigInt,
   type IGenericSqlite,
} from "../../../data/connection/sqlite/GenericSqliteConnection";
import { DatabaseSync } from "node:sqlite";

export type NodeSqliteConnectionConfig = {
   database: DatabaseSync;
};

function nodeSqliteExecutor(db: DatabaseSync): IGenericSqlite<DatabaseSync> {
   const getStmt = (sql: string) => {
      const stmt = db.prepare(sql);
      //stmt.setReadBigInts(true);
      return stmt;
   };

   return {
      db,
      query: buildQueryFn({
         all: (sql, parameters = []) => getStmt(sql).all(...parameters),
         run: (sql, parameters = []) => {
            const { changes, lastInsertRowid } = getStmt(sql).run(...parameters);
            return {
               insertId: parseBigInt(lastInsertRowid),
               numAffectedRows: parseBigInt(changes),
            };
         },
      }),
      close: () => db.close(),
      iterator: (isSelect, sql, parameters = []) => {
         if (!isSelect) {
            throw new Error("Only support select in stream()");
         }
         return getStmt(sql).iterate(...parameters) as any;
      },
   };
}

export function nodeSqlite(config?: NodeSqliteConnectionConfig | { url: string }) {
   let database: DatabaseSync;
   if (config) {
      if ("database" in config) {
         database = config.database;
      } else {
         database = new DatabaseSync(config.url);
      }
   } else {
      database = new DatabaseSync(":memory:");
   }

   return new GenericSqliteConnection(database, () => nodeSqliteExecutor(database), {
      name: "node-sqlite",
   });
}
