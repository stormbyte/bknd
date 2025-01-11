import { describe, expect, it } from "bun:test";
import { shouldSkipAuth } from "../../src/auth/middlewares";

describe("auth middleware", () => {
   it("should skip auth on asset paths", () => {
      expect(shouldSkipAuth(new Request("http://localhost/assets/test.js"))).toBe(true);
      expect(shouldSkipAuth(new Request("http://localhost/"))).toBe(false);
   });
});
