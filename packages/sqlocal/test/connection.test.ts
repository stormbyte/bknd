import { describe, expect, it } from "vitest";
import { SQLocalConnection, type SQLocalConnectionConfig } from "../src";

describe(SQLocalConnection, () => {
   function create(config: SQLocalConnectionConfig = {}) {
      return new SQLocalConnection(config);
   }

   it("constructs", async () => {
      const connection = create();
      expect(() => connection.client).toThrow();
      await connection.init();
      expect(connection.client).toBeDefined();
      expect(await connection.client.sql`SELECT 1`).toEqual([{ "1": 1 }]);
   });
});
