import type { Connection } from "bknd/data";
import { $console } from "bknd/core";
import { bunSqlite } from "../bun/connection/BunSqliteConnection";

export function sqlite(config: { url: string }): Connection {
   $console.info("Using bun-sqlite", config);
   return bunSqlite(config);
}
