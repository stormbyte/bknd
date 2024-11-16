import * as assert from "node:assert/strict";
import { createWriteStream } from "node:fs";
import { test } from "node:test";
import { Miniflare } from "miniflare";

// https://github.com/nodejs/node/issues/44372#issuecomment-1736530480
console.log = async (message: any) => {
   const tty = createWriteStream("/dev/tty");
   const msg = typeof message === "string" ? message : JSON.stringify(message, null, 2);
   return tty.write(`${msg}\n`);
};

test("what", async () => {
   const mf = new Miniflare({
      modules: true,
      script: "export default { async fetch() { return new Response(null); } }",
      r2Buckets: ["BUCKET"]
   });

   const bucket = await mf.getR2Bucket("BUCKET");
   console.log(await bucket.put("count", "1"));

   const object = await bucket.get("count");
   if (object) {
      /*const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);*/
      console.log("yo -->", await object.text());

      assert.strictEqual(await object.text(), "1");
   }

   await mf.dispose();
});
