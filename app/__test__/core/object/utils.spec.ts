import { describe, expect, test } from "bun:test";
import * as utils from "../../../src/core/utils/objects";

describe("object utils", () => {
   test("flattenObject", () => {
      const obj = {
         a: {
            b: {
               c: 1,
               a: ["a", "b", "c"]
            }
         },
         d: [1, 2, { e: 3 }]
      };

      console.log("flat", utils.flattenObject2(obj));
      expect(utils.flattenObject2(obj)).toEqual({
         "a.b.c": 1,
         "a.b.a[0]": "a",
         "a.b.a[1]": "b",
         "a.b.a[2]": "c",
         "d[0]": 1,
         "d[1]": 2,
         "d[2].e": 3
      });
   });
});
