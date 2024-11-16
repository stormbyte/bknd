import { baseline, bench, group, run } from "mitata";
import * as crypt from "../../../src/core/utils/crypto";

// deno
// import { ... } from 'npm:mitata';

// d8/jsc
// import { ... } from '<path to mitata>/src/cli.mjs';

const small = "hello";
const big = "hello".repeat(1000);

group("hashing (small)", () => {
   baseline("baseline", () => JSON.parse(JSON.stringify({ small })));
   bench("sha-1", async () => await crypt.hash.sha256(small));
   bench("sha-256", async () => await crypt.hash.sha256(small));
});

group("hashing (big)", () => {
   baseline("baseline", () => JSON.parse(JSON.stringify({ big })));
   bench("sha-1", async () => await crypt.hash.sha256(big));
   bench("sha-256", async () => await crypt.hash.sha256(big));
});

/*group({ name: 'group2', summary: false }, () => {
   bench('new Array(0)', () => new Array(0));
   bench('new Array(1024)', () => new Array(1024));
});*/

// @ts-ignore
await run();
