import { describe, expect, test } from "bun:test";
import * as large from "../../src/media/storage/mime-types";
import * as tiny from "../../src/media/storage/mime-types-tiny";

describe("media/mime-types", () => {
   test("tiny resolves", () => {
      const tests = [[".mp4", "video/mp4", ".jpg", "image/jpeg", ".zip", "application/zip"]];

      for (const [ext, mime] of tests) {
         expect(tiny.guess(ext)).toBe(mime);
      }
   });

   test("all tiny resolves to large", () => {
      for (const [ext, mime] of Object.entries(tiny.M)) {
         expect(large.guessMimeType("." + ext)).toBe(mime);
      }

      for (const [type, exts] of Object.entries(tiny.Q)) {
         for (const ext of exts) {
            const ex = `${type}/${ext}`;
            try {
               expect(large.guessMimeType("." + ext)).toBe(ex);
            } catch (e) {
               console.log(`Failed for ${ext}`, {
                  type,
                  exts,
                  ext,
                  expected: ex,
                  actual: large.guessMimeType("." + ext)
               });
               throw new Error(`Failed for ${ext}`);
            }
         }
      }
   });

   test("isMimeType", () => {
      expect(tiny.isMimeType("image/jpeg")).toBe(true);
      expect(tiny.isMimeType("image/jpeg", ["image/png"])).toBe(true);
      expect(tiny.isMimeType("image/png", ["image/png"])).toBe(false);
      expect(tiny.isMimeType("image/png")).toBe(true);
      expect(tiny.isMimeType("whatever")).toBe(false);
      expect(tiny.isMimeType("text/tab-separated-values")).toBe(true);
   });

   test("extension", () => {
      expect(tiny.extension("image/png")).toBe("png");
      expect(tiny.extension("image/jpeg")).toBe("jpeg");
      expect(tiny.extension("application/zip")).toBe("zip");
      expect(tiny.extension("text/tab-separated-values")).toBe("tsv");
      expect(tiny.extension("application/zip")).toBe("zip");
   });
});
