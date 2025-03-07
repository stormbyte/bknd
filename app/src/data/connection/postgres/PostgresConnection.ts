import {
   Kysely,
   PostgresDialect,
   type DatabaseIntrospector,
   type ColumnDataType,
   type ColumnDefinitionBuilder,
   ParseJSONResultsPlugin,
} from "kysely";
import pg from "pg";
import { PostgresIntrospector } from "./PostgresIntrospector";
import { type FieldSpec, type SchemaResponse, Connection } from "data/connection/Connection";

export type PostgresConnectionConfig = pg.PoolConfig;

const plugins = [new ParseJSONResultsPlugin()];

class CustomPostgresDialect extends PostgresDialect {
   override createIntrospector(db: Kysely<any>): DatabaseIntrospector {
      return new PostgresIntrospector(db);
   }
}

export class PostgresConnection extends Connection {
   constructor(config: PostgresConnectionConfig) {
      const kysely = new Kysely({
         dialect: new CustomPostgresDialect({
            pool: new pg.Pool(config),
         }),
         plugins,
         //log: ["query", "error"],
      });

      super(kysely, {}, plugins);
   }

   override supportsIndices(): boolean {
      return true;
   }

   override getFieldSchema(spec: FieldSpec): SchemaResponse {
      this.validateFieldSpecType(spec.type);
      let type: ColumnDataType = spec.primary ? "serial" : spec.type;

      switch (spec.type) {
         case "date":
         case "datetime":
            type = "timestamp";
            break;
         case "text":
            type = "varchar";
            break;
      }

      return [
         spec.name,
         type,
         (col: ColumnDefinitionBuilder) => {
            if (spec.primary) {
               return col.primaryKey();
            }
            if (spec.references) {
               return col
                  .references(spec.references)
                  .onDelete(spec.onDelete ?? "set null")
                  .onUpdate(spec.onUpdate ?? "no action");
            }
            return spec.nullable ? col : col.notNull();
         },
      ];
   }
}
