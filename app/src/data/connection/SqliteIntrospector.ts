import {
   type DatabaseIntrospector,
   type DatabaseMetadata,
   type DatabaseMetadataOptions,
   type Kysely,
   ParseJSONResultsPlugin,
   type SchemaMetadata,
   type TableMetadata,
   type KyselyPlugin,
} from "kysely";
import { DEFAULT_MIGRATION_LOCK_TABLE, DEFAULT_MIGRATION_TABLE, sql } from "kysely";
import type { ConnectionIntrospector, IndexMetadata } from "./Connection";
import { KyselyPluginRunner } from "data";

export type SqliteIntrospectorConfig = {
   excludeTables?: string[];
   plugins?: KyselyPlugin[];
};

export class SqliteIntrospector implements DatabaseIntrospector, ConnectionIntrospector {
   readonly #db: Kysely<any>;
   readonly _excludeTables: string[] = [];
   readonly _plugins: KyselyPlugin[];

   constructor(db: Kysely<any>, config: SqliteIntrospectorConfig = {}) {
      this.#db = db;
      this._excludeTables = config.excludeTables ?? [];
      this._plugins = config.plugins ?? [new ParseJSONResultsPlugin()];
   }

   async getSchemas(): Promise<SchemaMetadata[]> {
      // Sqlite doesn't support schemas.
      return [];
   }

   async getSchema() {
      const excluded = [
         ...this._excludeTables,
         DEFAULT_MIGRATION_TABLE,
         DEFAULT_MIGRATION_LOCK_TABLE,
      ];
      const query = sql`
         SELECT m.name, m.type, m.sql,
            (SELECT json_group_array(
               json_object(
                  'name', p.name,
                  'type', p.type,
                  'notnull', p."notnull",
                  'default', p.dflt_value,
                  'primary_key', p.pk
               )) FROM pragma_table_info(m.name) p) AS columns,
            (SELECT json_group_array(
               json_object(
                  'name', i.name,
                  'origin', i.origin,
                  'partial', i.partial,
                  'sql', im.sql,
                  'columns', (SELECT json_group_array(
                     json_object(
                        'name', ii.name,
                        'seqno', ii.seqno
                     )) FROM pragma_index_info(i.name) ii)
               )) FROM pragma_index_list(m.name) i
                 LEFT JOIN sqlite_master im ON im.name = i.name
                  AND im.type = 'index'
            ) AS indices
         FROM sqlite_master m
         WHERE m.type IN ('table', 'view')
           and m.name not like 'sqlite_%'
           and m.name not in (${excluded.join(", ")})
      `;

      const result = await query.execute(this.#db);
      const runner = new KyselyPluginRunner(this._plugins ?? []);
      const tables = (await runner.transformResultRows(result.rows)) as unknown as {
         name: string;
         type: string;
         sql: string;
         columns: {
            name: string;
            type: string;
            notnull: number;
            dflt_value: any;
            pk: number;
         }[];
         indices: {
            name: string;
            origin: string;
            partial: number;
            sql: string;
            columns: { name: string; seqno: number }[];
         }[];
      }[];

      //console.log("tables", tables);
      return tables.map((table) => ({
         name: table.name,
         isView: table.type === "view",
         columns: table.columns.map((col) => {
            const autoIncrementCol = table.sql
               ?.split(/[\(\),]/)
               ?.find((it) => it.toLowerCase().includes("autoincrement"))
               ?.trimStart()
               ?.split(/\s+/)?.[0]
               ?.replace(/["`]/g, "");

            return {
               name: col.name,
               dataType: col.type,
               isNullable: !col.notnull,
               isAutoIncrementing: col.name === autoIncrementCol,
               hasDefaultValue: col.dflt_value != null,
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

   async getMetadata(options?: DatabaseMetadataOptions): Promise<DatabaseMetadata> {
      return {
         tables: await this.getTables(options),
      };
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
