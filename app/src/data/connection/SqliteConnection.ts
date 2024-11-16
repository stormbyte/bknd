import type { Kysely, KyselyPlugin } from "kysely";
import { jsonArrayFrom, jsonBuildObject, jsonObjectFrom } from "kysely/helpers/sqlite";
import { Connection, type DbFunctions } from "./Connection";

export class SqliteConnection extends Connection {
   constructor(kysely: Kysely<any>, fn: Partial<DbFunctions> = {}, plugins: KyselyPlugin[] = []) {
      super(
         kysely,
         {
            ...fn,
            jsonArrayFrom,
            jsonObjectFrom,
            jsonBuildObject
         },
         plugins
      );
   }

   override supportsIndices(): boolean {
      return true;
   }
}
