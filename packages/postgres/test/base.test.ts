import { describe, it, expect } from "bun:test";

import { PostgresConnection } from "../src";
import { createConnection, cleanDatabase } from "./setup";

describe(PostgresConnection, () => {
   it("should connect to the database", async () => {
      const connection = createConnection();
      expect(await connection.ping()).toBe(true);
   });

   it("should clean the database", async () => {
      const connection = createConnection();
      await cleanDatabase(connection);

      const tables = await connection.getIntrospector().getTables();
      expect(tables).toEqual([]);
   });
});
