import { describe, expect, test } from "bun:test";
import { checksum, hash } from "../../src/core/utils";

describe("crypto", async () => {
   test("sha256", async () => {
      expect(await hash.sha256("test")).toBe(
         "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
      );
   });
   test("sha1", async () => {
      expect(await hash.sha1("test")).toBe("a94a8fe5ccb19ba61c4c0873d391e987982fbbd3");
   });
   test("checksum", async () => {
      expect(await checksum("hello world")).toBe("2aae6c35c94fcfb415dbe95f408b9ce91ee846ed");
   });
});
