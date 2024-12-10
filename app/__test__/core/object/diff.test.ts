import { describe, expect, it, test } from "bun:test";
import { apply, diff, revert } from "../../../src/core/object/diff";

describe("diff", () => {
   it("should detect added properties", () => {
      const oldObj = { a: 1 };
      const newObj = { a: 1, b: 2 };

      const diffs = diff(oldObj, newObj);

      expect(diffs).toEqual([
         {
            t: "a",
            p: ["b"],
            o: undefined,
            n: 2
         }
      ]);

      const appliedObj = apply(oldObj, diffs);
      expect(appliedObj).toEqual(newObj);

      const revertedObj = revert(newObj, diffs);
      expect(revertedObj).toEqual(oldObj);
   });

   it("should detect removed properties", () => {
      const oldObj = { a: 1, b: 2 };
      const newObj = { a: 1 };

      const diffs = diff(oldObj, newObj);

      expect(diffs).toEqual([
         {
            t: "r",
            p: ["b"],
            o: 2,
            n: undefined
         }
      ]);

      const appliedObj = apply(oldObj, diffs);
      expect(appliedObj).toEqual(newObj);

      const revertedObj = revert(newObj, diffs);
      expect(revertedObj).toEqual(oldObj);
   });

   it("should detect edited properties", () => {
      const oldObj = { a: 1 };
      const newObj = { a: 2 };

      const diffs = diff(oldObj, newObj);

      expect(diffs).toEqual([
         {
            t: "e",
            p: ["a"],
            o: 1,
            n: 2
         }
      ]);

      const appliedObj = apply(oldObj, diffs);
      expect(appliedObj).toEqual(newObj);

      const revertedObj = revert(newObj, diffs);
      expect(revertedObj).toEqual(oldObj);
   });

   it("should detect changes in nested objects", () => {
      const oldObj = { a: { b: 1 } };
      const newObj = { a: { b: 2 } };

      const diffs = diff(oldObj, newObj);

      expect(diffs).toEqual([
         {
            t: "e",
            p: ["a", "b"],
            o: 1,
            n: 2
         }
      ]);

      const appliedObj = apply(oldObj, diffs);
      expect(appliedObj).toEqual(newObj);

      const revertedObj = revert(newObj, diffs);
      expect(revertedObj).toEqual(oldObj);
   });

   it("should detect changes in arrays", () => {
      const oldObj = { a: [1, 2, 3] };
      const newObj = { a: [1, 4, 3, 5] };

      const diffs = diff(oldObj, newObj);

      expect(diffs).toEqual([
         {
            t: "e",
            p: ["a", 1],
            o: 2,
            n: 4
         },
         {
            t: "a",
            p: ["a", 3],
            o: undefined,
            n: 5
         }
      ]);

      const appliedObj = apply(oldObj, diffs);
      expect(appliedObj).toEqual(newObj);

      const revertedObj = revert(newObj, diffs);
      expect(revertedObj).toEqual(oldObj);
   });

   it("should handle adding elements to an empty array", () => {
      const oldObj = { a: [] };
      const newObj = { a: [1, 2, 3] };

      const diffs = diff(oldObj, newObj);

      expect(diffs).toEqual([
         {
            t: "a",
            p: ["a", 0],
            o: undefined,
            n: 1
         },
         {
            t: "a",
            p: ["a", 1],
            o: undefined,
            n: 2
         },
         {
            t: "a",
            p: ["a", 2],
            o: undefined,
            n: 3
         }
      ]);

      const appliedObj = apply(oldObj, diffs);
      expect(appliedObj).toEqual(newObj);

      const revertedObj = revert(newObj, diffs);
      expect(revertedObj).toEqual(oldObj);
   });

   it("should handle removing elements from an array", () => {
      const oldObj = { a: [1, 2, 3] };
      const newObj = { a: [1, 3] };

      const diffs = diff(oldObj, newObj);

      expect(diffs).toEqual([
         {
            t: "e",
            p: ["a", 1],
            o: 2,
            n: 3
         },
         {
            t: "r",
            p: ["a", 2],
            o: 3,
            n: undefined
         }
      ]);

      const appliedObj = apply(oldObj, diffs);
      expect(appliedObj).toEqual(newObj);

      const revertedObj = revert(newObj, diffs);
      expect(revertedObj).toEqual(oldObj);
   });

   it("should handle complex nested changes", () => {
      const oldObj = {
         a: {
            b: [1, 2, { c: 3 }]
         }
      };

      const newObj = {
         a: {
            b: [1, 2, { c: 4 }, 5]
         }
      };

      const diffs = diff(oldObj, newObj);

      expect(diffs).toEqual([
         {
            t: "e",
            p: ["a", "b", 2, "c"],
            o: 3,
            n: 4
         },
         {
            t: "a",
            p: ["a", "b", 3],
            o: undefined,
            n: 5
         }
      ]);

      const appliedObj = apply(oldObj, diffs);
      expect(appliedObj).toEqual(newObj);

      const revertedObj = revert(newObj, diffs);
      expect(revertedObj).toEqual(oldObj);
   });

   it("should handle undefined and null values", () => {
      const oldObj = { a: undefined, b: null };
      const newObj = { a: null, b: undefined };

      const diffs = diff(oldObj, newObj);

      expect(diffs).toEqual([
         {
            t: "e",
            p: ["a"],
            o: undefined,
            n: null
         },
         {
            t: "e",
            p: ["b"],
            o: null,
            n: undefined
         }
      ]);

      const appliedObj = apply(oldObj, diffs);
      expect(appliedObj).toEqual(newObj);

      const revertedObj = revert(newObj, diffs);
      expect(revertedObj).toEqual(oldObj);
   });

   it("should handle type changes", () => {
      const oldObj = { a: 1 };
      const newObj = { a: "1" };

      const diffs = diff(oldObj, newObj);

      expect(diffs).toEqual([
         {
            t: "e",
            p: ["a"],
            o: 1,
            n: "1"
         }
      ]);

      const appliedObj = apply(oldObj, diffs);
      expect(appliedObj).toEqual(newObj);

      const revertedObj = revert(newObj, diffs);
      expect(revertedObj).toEqual(oldObj);
   });

   it("should handle properties added and removed simultaneously", () => {
      const oldObj = { a: 1, b: 2 };
      const newObj = { a: 1, c: 3 };

      const diffs = diff(oldObj, newObj);

      expect(diffs).toEqual([
         {
            t: "r",
            p: ["b"],
            o: 2,
            n: undefined
         },
         {
            t: "a",
            p: ["c"],
            o: undefined,
            n: 3
         }
      ]);

      const appliedObj = apply(oldObj, diffs);
      expect(appliedObj).toEqual(newObj);

      const revertedObj = revert(newObj, diffs);
      expect(revertedObj).toEqual(oldObj);
   });

   it("should handle arrays replaced with objects", () => {
      const oldObj = { a: [1, 2, 3] };
      const newObj = { a: { b: 4 } };

      const diffs = diff(oldObj, newObj);

      expect(diffs).toEqual([
         {
            t: "e",
            p: ["a"],
            o: [1, 2, 3],
            n: { b: 4 }
         }
      ]);

      const appliedObj = apply(oldObj, diffs);
      expect(appliedObj).toEqual(newObj);

      const revertedObj = revert(newObj, diffs);
      expect(revertedObj).toEqual(oldObj);
   });

   it("should handle objects replaced with primitives", () => {
      const oldObj = { a: { b: 1 } };
      const newObj = { a: 2 };

      const diffs = diff(oldObj, newObj);

      expect(diffs).toEqual([
         {
            t: "e",
            p: ["a"],
            o: { b: 1 },
            n: 2
         }
      ]);

      const appliedObj = apply(oldObj, diffs);
      expect(appliedObj).toEqual(newObj);

      const revertedObj = revert(newObj, diffs);
      expect(revertedObj).toEqual(oldObj);
   });

   it("should handle root object changes", () => {
      const oldObj = { a: 1 };
      const newObj = { b: 2 };

      const diffs = diff(oldObj, newObj);

      expect(diffs).toEqual([
         {
            t: "r",
            p: ["a"],
            o: 1,
            n: undefined
         },
         {
            t: "a",
            p: ["b"],
            o: undefined,
            n: 2
         }
      ]);

      const appliedObj = apply(oldObj, diffs);
      expect(appliedObj).toEqual(newObj);

      const revertedObj = revert(newObj, diffs);
      expect(revertedObj).toEqual(oldObj);
   });

   it("should handle identical objects", () => {
      const oldObj = { a: 1, b: { c: 2 } };
      const newObj = { a: 1, b: { c: 2 } };

      const diffs = diff(oldObj, newObj);

      expect(diffs).toEqual([]);

      const appliedObj = apply(oldObj, diffs);
      expect(appliedObj).toEqual(newObj);

      const revertedObj = revert(newObj, diffs);
      expect(revertedObj).toEqual(oldObj);
   });

   it("should handle empty objects", () => {
      const oldObj = {};
      const newObj = {};

      const diffs = diff(oldObj, newObj);

      expect(diffs).toEqual([]);

      const appliedObj = apply(oldObj, diffs);
      expect(appliedObj).toEqual(newObj);

      const revertedObj = revert(newObj, diffs);
      expect(revertedObj).toEqual(oldObj);
   });

   it("should handle changes from empty object to non-empty object", () => {
      const oldObj = {};
      const newObj = { a: 1 };

      const diffs = diff(oldObj, newObj);

      expect(diffs).toEqual([
         {
            t: "a",
            p: ["a"],
            o: undefined,
            n: 1
         }
      ]);

      const appliedObj = apply(oldObj, diffs);
      expect(appliedObj).toEqual(newObj);

      const revertedObj = revert(newObj, diffs);
      expect(revertedObj).toEqual(oldObj);
   });

   it("should handle changes from non-empty object to empty object", () => {
      const oldObj = { a: 1 };
      const newObj = {};

      const diffs = diff(oldObj, newObj);

      expect(diffs).toEqual([
         {
            t: "r",
            p: ["a"],
            o: 1,
            n: undefined
         }
      ]);

      const appliedObj = apply(oldObj, diffs);
      expect(appliedObj).toEqual(newObj);

      const revertedObj = revert(newObj, diffs);
      expect(revertedObj).toEqual(oldObj);
   });
});
