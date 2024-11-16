import { _jsonp } from "core/utils";
import { type Kysely, sql } from "kysely";
import { set } from "lodash-es";

export type MigrationContext = {
   db: Kysely<any>;
};
export type GenericConfigObject = Record<string, any>;

export type Migration = {
   version: number;
   schema?: true;
   up: (config: GenericConfigObject, ctx: MigrationContext) => Promise<GenericConfigObject>;
};

export const migrations: Migration[] = [
   {
      version: 1,
      schema: true,
      up: async (config, { db }) => {
         //console.log("config given", config);
         await db.schema
            .createTable(TABLE_NAME)
            .addColumn("id", "integer", (col) => col.primaryKey().notNull().autoIncrement())
            .addColumn("version", "integer", (col) => col.notNull())
            .addColumn("type", "text", (col) => col.notNull())
            .addColumn("json", "text")
            .addColumn("created_at", "datetime", (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
            .addColumn("updated_at", "datetime", (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
            .execute();

         await db
            .insertInto(TABLE_NAME)
            .values({ version: 1, type: "config", json: null })
            .execute();

         return config;
      }
   },
   {
      version: 2,
      up: async (config, { db }) => {
         return config;
      }
   },
   {
      version: 3,
      schema: true,
      up: async (config, { db }) => {
         await db.schema.alterTable(TABLE_NAME).addColumn("deleted_at", "datetime").execute();

         return config;
      }
   },
   {
      version: 4,
      up: async (config, { db }) => {
         return {
            ...config,
            auth: {
               ...config.auth,
               basepath: "/api/auth2"
            }
         };
      }
   },
   {
      version: 5,
      up: async (config, { db }) => {
         //console.log("config", _jsonp(config));
         const cors = config.server.cors?.allow_methods ?? [];
         set(config.server, "cors.allow_methods", [...new Set([...cors, "PATCH"])]);
         return config;
      }
   },
   {
      version: 6,
      up: async (config, { db }) => {
         return config;
      }
   }
];

export const CURRENT_VERSION = migrations[migrations.length - 1]?.version ?? 0;
export const TABLE_NAME = "__bknd";

export async function migrateTo(
   current: number,
   to: number,
   config: GenericConfigObject,
   ctx: MigrationContext
): Promise<[number, GenericConfigObject]> {
   //console.log("migrating from", current, "to", CURRENT_VERSION, config);
   const todo = migrations.filter((m) => m.version > current && m.version <= to);
   //console.log("todo", todo.length);
   let updated = Object.assign({}, config);

   let i = 0;
   let version = current;
   for (const migration of todo) {
      //console.log("-- running migration", i + 1, "of", todo.length, { version: migration.version });
      try {
         updated = await migration.up(updated, ctx);
         version = migration.version;
         i++;
      } catch (e: any) {
         console.error(e);
         throw new Error(`Migration ${migration.version} failed: ${e.message}`);
      }
   }

   return [version, updated];
}

export async function migrateSchema(to: number, ctx: MigrationContext, current: number = 0) {
   console.log("migrating SCHEMA to", to, "from", current);
   const todo = migrations.filter((m) => m.version > current && m.version <= to && m.schema);
   console.log("todo", todo.length);

   let i = 0;
   let version = 0;
   for (const migration of todo) {
      console.log("-- running migration", i + 1, "of", todo.length);
      try {
         await migration.up({}, ctx);
         version = migration.version;
         i++;
      } catch (e: any) {
         console.error(e);
         throw new Error(`Migration ${migration.version} failed: ${e.message}`);
      }
   }

   return version;
}

export async function migrate(
   current: number,
   config: GenericConfigObject,
   ctx: MigrationContext
): Promise<[number, GenericConfigObject]> {
   return migrateTo(current, CURRENT_VERSION, config, ctx);
}
