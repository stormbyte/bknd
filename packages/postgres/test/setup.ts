import type { Kysely } from "kysely";
import { PostgresConnection, PostgresIntrospector, type PostgresConnectionConfig } from "../src";

export const info = {
   host: "localhost",
   port: 5430,
   user: "postgres",
   password: "postgres",
   database: "bknd",
};

export function createConnection(config: PostgresConnectionConfig = {}) {
   return new PostgresConnection({
      ...info,
      ...config,
   });
}

export async function cleanDatabase(connection: PostgresConnection) {
   const kysely = connection.kysely;

   // drop all tables & create new schema
   await kysely.schema.dropSchema("public").ifExists().cascade().execute();
   await kysely.schema.createSchema("public").execute();
}
