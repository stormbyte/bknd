import { describe, expect, it } from "bun:test";
import { DataApi } from "../../src/data/api/DataApi";

describe("DataApi", () => {
   it("should switch to post for long url reads", async () => {
      const api = new DataApi();

      const get = api.readMany("a".repeat(100), { select: ["id", "name"] });
      expect(get.request.method).toBe("GET");
      expect(new URL(get.request.url).pathname).toBe(`/api/data/${"a".repeat(100)}`);

      const post = api.readMany("a".repeat(1000), { select: ["id", "name"] });
      expect(post.request.method).toBe("POST");
      expect(new URL(post.request.url).pathname).toBe(`/api/data/${"a".repeat(1000)}/query`);
   });
});
