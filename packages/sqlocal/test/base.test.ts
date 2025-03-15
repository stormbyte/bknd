import { describe, expect, it } from "vitest";
import { SQLocal } from "sqlocal";

describe("base", () => {
   const { sql } = new SQLocal(":memory:");

   it("works", async () => {
      expect(await sql`SELECT 1`).toEqual([{ "1": 1 }]);
   });
});
