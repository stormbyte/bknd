import { Connection, type FieldSpec, type SchemaResponse } from "bknd/data";
import {
   type ColumnDataType,
   type ColumnDefinitionBuilder,
   type DatabaseIntrospector,
   Kysely,
   ParseJSONResultsPlugin,
   PostgresDialect,
   type SelectQueryBuilder,
} from "kysely";
import { jsonArrayFrom, jsonBuildObject, jsonObjectFrom } from "kysely/helpers/postgres";
import pg from "pg";
import { PostgresIntrospector } from "./PostgresIntrospector";

export type PostgresConnectionConfig = pg.PoolConfig;
export type QB = SelectQueryBuilder<any, any, any>;

const plugins = [new ParseJSONResultsPlugin()];

class CustomPostgresDialect extends PostgresDialect {
   override createIntrospector(db: Kysely<any>): DatabaseIntrospector {
      return new PostgresIntrospector(db, {
         excludeTables: [],
      });
   }
}

export class PostgresConnection extends Connection {
   protected override readonly supported = {
      batching: true,
   };
   private pool: pg.Pool;

   constructor(config: PostgresConnectionConfig) {
      const pool = new pg.Pool(config);
      const kysely = new Kysely({
         dialect: new CustomPostgresDialect({
            pool,
         }),
         plugins,
         //log: ["query", "error"],
      });

      super(
         kysely,
         {
            jsonArrayFrom,
            jsonBuildObject,
            jsonObjectFrom,
         },
         plugins,
      );
      this.pool = pool;
   }

   override getFieldSchema(spec: FieldSpec): SchemaResponse {
      this.validateFieldSpecType(spec.type);
      let type: ColumnDataType = spec.primary ? "serial" : spec.type;

      switch (spec.type) {
         case "blob":
            type = "bytea";
            break;
         case "date":
         case "datetime":
            // https://www.postgresql.org/docs/17/datatype-datetime.html
            type = "timestamp";
            break;
         case "text":
            // https://www.postgresql.org/docs/17/datatype-character.html
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

   override async close(): Promise<void> {
      await this.pool.end();
   }

   protected override async batch<Queries extends QB[]>(
      queries: [...Queries],
   ): Promise<{
      [K in keyof Queries]: Awaited<ReturnType<Queries[K]["execute"]>>;
   }> {
      return this.kysely.transaction().execute(async (trx) => {
         return Promise.all(queries.map((q) => trx.executeQuery(q).then((r) => r.rows)));
      }) as any;
   }
}
