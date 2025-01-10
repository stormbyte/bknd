import { describe, expect, test } from "bun:test";
import { createApp, registries } from "../../src";
import { em, entity, text } from "../../src/data";
import { StorageLocalAdapter } from "../../src/media/storage/adapters/StorageLocalAdapter";
import { AppMedia } from "../../src/modules";
import { moduleTestSuite } from "./module-test-suite";

describe("AppMedia", () => {
   moduleTestSuite(AppMedia);

   test("should allow additional fields", async () => {
      registries.media.register("local", StorageLocalAdapter);

      const app = createApp({
         initialConfig: {
            media: {
               entity_name: "media",
               enabled: true,
               adapter: {
                  type: "local",
                  config: {
                     path: "./"
                  }
               }
            },
            data: em({
               media: entity("media", {
                  additional: text()
               })
            }).toJSON()
         }
      });

      await app.build();

      const fields = app.modules.em.entity("media").fields.map((f) => f.name);
      expect(fields).toContain("additional");
      expect(fields).toEqual([
         "id",
         "additional",
         "path",
         "folder",
         "mime_type",
         "size",
         "scope",
         "etag",
         "modified_at",
         "reference",
         "entity_id",
         "metadata"
      ]);
   });
});
