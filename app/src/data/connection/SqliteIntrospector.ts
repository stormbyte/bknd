import type {
   DatabaseIntrospector,
   DatabaseMetadata,
   DatabaseMetadataOptions,
   ExpressionBuilder,
   Kysely,
   SchemaMetadata,
   TableMetadata
} from "kysely";
import { DEFAULT_MIGRATION_LOCK_TABLE, DEFAULT_MIGRATION_TABLE, sql } from "kysely";
import type { ConnectionIntrospector, IndexMetadata } from "./Connection";

export type SqliteIntrospectorConfig = {
   excludeTables?: string[];
};

export class SqliteIntrospector implements DatabaseIntrospector, ConnectionIntrospector {
   readonly #db: Kysely<any>;
   readonly _excludeTables: string[] = [];

   constructor(db: Kysely<any>, config: SqliteIntrospectorConfig = {}) {
      this.#db = db;
      this._excludeTables = config.excludeTables ?? [];
   }

   async getSchemas(): Promise<SchemaMetadata[]> {
      // Sqlite doesn't support schemas.
      return [];
   }

   async getIndices(tbl_name?: string): Promise<IndexMetadata[]> {
      const indices = await this.#db
         .selectFrom("sqlite_master")
         .where("type", "=", "index")
         .$if(!!tbl_name, (eb) => eb.where("tbl_name", "=", tbl_name))
         .select("name")
         .$castTo<{ name: string }>()
         .execute();

      return Promise.all(indices.map(({ name }) => this.#getIndexMetadata(name)));
   }

   async #getIndexMetadata(index: string): Promise<IndexMetadata> {
      const db = this.#db;

      // Get the SQL that was used to create the index.
      const indexDefinition = await db
         .selectFrom("sqlite_master")
         .where("name", "=", index)
         .select(["sql", "tbl_name", "type"])
         .$castTo<{ sql: string | undefined; tbl_name: string; type: string }>()
         .executeTakeFirstOrThrow();

      //console.log("--indexDefinition--", indexDefinition, index);

      // check unique by looking for the word "unique" in the sql
      const isUnique = indexDefinition.sql?.match(/unique/i) != null;

      const columns = await db
         .selectFrom(
            sql<{
               seqno: number;
               cid: number;
               name: string;
            }>`pragma_index_info(${index})`.as("index_info")
         )
         .select(["seqno", "cid", "name"])
         .orderBy("cid")
         .execute();

      return {
         name: index,
         table: indexDefinition.tbl_name,
         isUnique: isUnique,
         columns: columns.map((col) => ({
            name: col.name,
            order: col.seqno
         }))
      };
   }

   private excludeTables(tables: string[] = []) {
      return (eb: ExpressionBuilder<any, any>) => {
         const and = tables.map((t) => eb("name", "!=", t));
         return eb.and(and);
      };
   }

   async getTables(
      options: DatabaseMetadataOptions = { withInternalKyselyTables: false }
   ): Promise<TableMetadata[]> {
      let query = this.#db
         .selectFrom("sqlite_master")
         .where("type", "in", ["table", "view"])
         .where("name", "not like", "sqlite_%")
         .select("name")
         .orderBy("name")
         .$castTo<{ name: string }>();

      if (!options.withInternalKyselyTables) {
         query = query.where(
            this.excludeTables([DEFAULT_MIGRATION_TABLE, DEFAULT_MIGRATION_LOCK_TABLE])
         );
      }
      if (this._excludeTables.length > 0) {
         query = query.where(this.excludeTables(this._excludeTables));
      }

      const tables = await query.execute();
      return Promise.all(tables.map(({ name }) => this.#getTableMetadata(name)));
   }

   async getMetadata(options?: DatabaseMetadataOptions): Promise<DatabaseMetadata> {
      return {
         tables: await this.getTables(options)
      };
   }

   async #getTableMetadata(table: string): Promise<TableMetadata> {
      const db = this.#db;

      // Get the SQL that was used to create the table.
      const tableDefinition = await db
         .selectFrom("sqlite_master")
         .where("name", "=", table)
         .select(["sql", "type"])
         .$castTo<{ sql: string | undefined; type: string }>()
         .executeTakeFirstOrThrow();

      // Try to find the name of the column that has `autoincrement` 🤦
      const autoIncrementCol = tableDefinition.sql
         ?.split(/[\(\),]/)
         ?.find((it) => it.toLowerCase().includes("autoincrement"))
         ?.trimStart()
         ?.split(/\s+/)?.[0]
         ?.replace(/["`]/g, "");

      const columns = await db
         .selectFrom(
            sql<{
               name: string;
               type: string;
               notnull: 0 | 1;
               dflt_value: any;
            }>`pragma_table_info(${table})`.as("table_info")
         )
         .select(["name", "type", "notnull", "dflt_value"])
         .orderBy("cid")
         .execute();

      return {
         name: table,
         isView: tableDefinition.type === "view",
         columns: columns.map((col) => ({
            name: col.name,
            dataType: col.type,
            isNullable: !col.notnull,
            isAutoIncrementing: col.name === autoIncrementCol,
            hasDefaultValue: col.dflt_value != null,
            comment: undefined
         }))
      };
   }
}
