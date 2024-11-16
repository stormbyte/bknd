import { describe, test } from "bun:test";
import { checksum, hash } from "../../src/core/utils";

describe("crypto", async () => {
   test("sha256", async () => {
      console.log(await hash.sha256("test"));
   });
   test("sha1", async () => {
      console.log(await hash.sha1("test"));
   });
   test("checksum", async () => {
      console.log(checksum("hello world"));
   });
});
