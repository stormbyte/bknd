import {
   type DatabaseIntrospector,
   type DatabaseMetadata,
   type DatabaseMetadataOptions,
   type SchemaMetadata,
   type TableMetadata,
   type Kysely,
   type KyselyPlugin,
   ParseJSONResultsPlugin,
} from "kysely";
import { DEFAULT_MIGRATION_LOCK_TABLE, DEFAULT_MIGRATION_TABLE, sql } from "kysely";
import { KyselyPluginRunner } from "data";
import type { IndexMetadata } from "data/connection/Connection";

export type PostgresIntrospectorConfig = {
   excludeTables?: string[];
   plugins?: KyselyPlugin[];
};

export class PostgresIntrospector implements DatabaseIntrospector {
   readonly #db: Kysely<any>;
   readonly _excludeTables: string[] = [];
   readonly _plugins: KyselyPlugin[];

   constructor(db: Kysely<any>, config: PostgresIntrospectorConfig = {}) {
      this.#db = db;
      this._excludeTables = config.excludeTables ?? [];
      this._plugins = config.plugins ?? [new ParseJSONResultsPlugin()];
   }

   async getSchemas(): Promise<SchemaMetadata[]> {
      const rawSchemas = await this.#db
         .selectFrom("pg_catalog.pg_namespace")
         .select("nspname")
         .$castTo<RawSchemaMetadata>()
         .execute();

      return rawSchemas.map((it) => ({ name: it.nspname }));
   }

   async getMetadata(options?: DatabaseMetadataOptions): Promise<DatabaseMetadata> {
      return {
         tables: await this.getTables(options),
      };
   }

   async getSchema() {
      const excluded = [
         ...this._excludeTables,
         DEFAULT_MIGRATION_TABLE,
         DEFAULT_MIGRATION_LOCK_TABLE,
      ];
      const query = sql`
         WITH tables_and_views AS (
            SELECT table_name AS name,
               table_type AS type
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_type IN ('BASE TABLE', 'VIEW')
              AND table_name NOT LIKE 'pg_%'
              AND table_name NOT IN (${excluded.join(", ")})
         ),

            columns_info AS (
               SELECT table_name AS name,
                  json_agg(json_build_object(
                     'name', column_name,
                     'type', data_type,
                     'notnull', (CASE WHEN is_nullable = 'NO' THEN true ELSE false END),
                     'dflt', column_default,
                     'pk', (SELECT COUNT(*) > 0
                        FROM information_schema.table_constraints tc
                        INNER JOIN information_schema.key_column_usage kcu
                          ON tc.constraint_name = kcu.constraint_name
                        WHERE tc.table_name = c.table_name
                          AND tc.constraint_type = 'PRIMARY KEY'
                          AND kcu.column_name = c.column_name)
                     )) AS columns
               FROM information_schema.columns c
               WHERE table_schema = 'public'
               GROUP BY table_name
            ),

            indices_info AS (
               SELECT
                  t.relname AS table_name,
                  json_agg(json_build_object(
                     'name', i.relname,
                     'origin', pg_get_indexdef(i.oid),
                     'partial', (CASE WHEN ix.indisvalid THEN false ELSE true END),
                     'sql', pg_get_indexdef(i.oid),
                     'columns', (
                        SELECT json_agg(json_build_object(
                           'name', a.attname,
                           'seqno', x.ordinal_position
                         ))
                        FROM unnest(ix.indkey) WITH ORDINALITY AS x(attnum, ordinal_position)
                            JOIN pg_attribute a ON a.attnum = x.attnum AND a.attrelid = t.oid
                     ))) AS indices
               FROM pg_class t
                  LEFT JOIN pg_index ix ON t.oid = ix.indrelid
                  LEFT JOIN pg_class i ON i.oid = ix.indexrelid
               WHERE t.relkind IN ('r', 'v')  -- r = table, v = view
                 AND t.relname NOT LIKE 'pg_%'
               GROUP BY t.relname
            )

         SELECT
            tv.name,
            tv.type,
            ci.columns,
            ii.indices
         FROM tables_and_views tv
            LEFT JOIN columns_info ci ON tv.name = ci.name
            LEFT JOIN indices_info ii ON tv.name = ii.table_name;
      `;

      const result = await query.execute(this.#db);
      const runner = new KyselyPluginRunner(this._plugins ?? []);
      const tables = (await runner.transformResultRows(result.rows)) as unknown as {
         name: string;
         type: "VIEW" | "BASE TABLE";
         columns: {
            name: string;
            type: string;
            notnull: number;
            dflt: string;
            pk: boolean;
         }[];
         indices: {
            name: string;
            origin: string;
            partial: number;
            sql: string;
            columns: { name: string; seqno: number }[];
         }[];
      }[];

      return tables.map((table) => ({
         name: table.name,
         isView: table.type === "VIEW",
         columns: table.columns.map((col) => {
            return {
               name: col.name,
               dataType: col.type,
               isNullable: !col.notnull,
               isAutoIncrementing: true, // just for now
               hasDefaultValue: col.dflt != null,
               comment: undefined,
            };
         }),
         indices: table.indices.map((index) => ({
            name: index.name,
            table: table.name,
            isUnique: index.sql?.match(/unique/i) != null,
            columns: index.columns.map((col) => ({
               name: col.name,
               order: col.seqno,
            })),
         })),
      }));
   }

   async getIndices(tbl_name?: string): Promise<IndexMetadata[]> {
      const schema = await this.getSchema();
      return schema
         .flatMap((table) => table.indices)
         .filter((index) => !tbl_name || index.table === tbl_name);
   }

   async getTables(
      options: DatabaseMetadataOptions = { withInternalKyselyTables: false },
   ): Promise<TableMetadata[]> {
      const schema = await this.getSchema();
      return schema.map((table) => ({
         name: table.name,
         isView: table.isView,
         columns: table.columns,
      }));
   }
}

interface RawSchemaMetadata {
   nspname: string;
}
