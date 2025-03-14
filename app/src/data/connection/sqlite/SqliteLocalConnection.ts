import {
   type DatabaseIntrospector,
   Kysely,
   ParseJSONResultsPlugin,
   type SqliteDatabase,
   SqliteDialect,
} from "kysely";
import { SqliteConnection } from "./SqliteConnection";
import { SqliteIntrospector } from "./SqliteIntrospector";

const plugins = [new ParseJSONResultsPlugin()];

class CustomSqliteDialect extends SqliteDialect {
   override createIntrospector(db: Kysely<any>): DatabaseIntrospector {
      return new SqliteIntrospector(db, {
         excludeTables: ["test_table"],
         plugins,
      });
   }
}

export class SqliteLocalConnection extends SqliteConnection {
   constructor(private database: SqliteDatabase) {
      const kysely = new Kysely({
         dialect: new CustomSqliteDialect({ database }),
         plugins,
      });

      super(kysely, {}, plugins);
   }
}
