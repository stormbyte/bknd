import { type ClassController, tbValidator as tb } from "core";
import { Type } from "core/utils";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { StorageAdapter } from "media";
import { StorageEvents } from "media";
import { getRandomizedFilename } from "media";
import type { AppMedia } from "../AppMedia";
import { MediaField } from "../MediaField";

const booleanLike = Type.Transform(Type.String())
   .Decode((v) => v === "1")
   .Encode((v) => (v ? "1" : "0"));

export class MediaController implements ClassController {
   constructor(private readonly media: AppMedia) {}

   private getStorageAdapter(): StorageAdapter {
      return this.getStorage().getAdapter();
   }

   private getStorage() {
      return this.media.storage;
   }

   getController(): Hono<any> {
      // @todo: multiple providers?
      // @todo: implement range requests

      const hono = new Hono();

      // get files list (temporary)
      hono.get("/files", async (c) => {
         const files = await this.getStorageAdapter().listObjects();
         return c.json(files);
      });

      // get file by name
      hono.get("/file/:filename", async (c) => {
         const { filename } = c.req.param();
         if (!filename) {
            throw new Error("No file name provided");
         }
         //console.log("getting file", filename, headersToObject(c.req.raw.headers));

         await this.getStorage().emgr.emit(new StorageEvents.FileAccessEvent({ name: filename }));
         return await this.getStorageAdapter().getObject(filename, c.req.raw.headers);
      });

      // delete a file by name
      hono.delete("/file/:filename", async (c) => {
         const { filename } = c.req.param();
         if (!filename) {
            throw new Error("No file name provided");
         }
         await this.getStorage().deleteFile(filename);

         return c.json({ message: "File deleted" });
      });

      const uploadSizeMiddleware = bodyLimit({
         maxSize: this.getStorage().getConfig().body_max_size,
         onError: (c: any) => {
            return c.text(`Payload exceeds ${this.getStorage().getConfig().body_max_size}`, 413);
         }
      });

      // upload file
      // @todo: add required type for "upload endpoints"
      hono.post("/upload/:filename", uploadSizeMiddleware, async (c) => {
         const { filename } = c.req.param();
         if (!filename) {
            throw new Error("No file name provided");
         }

         const file = await this.getStorage().getFileFromRequest(c);
         console.log("----file", file);
         return c.json(await this.getStorage().uploadFile(file, filename));
      });

      // add upload file to entity
      // @todo: add required type for "upload endpoints"
      hono.post(
         "/entity/:entity/:id/:field",
         tb(
            "query",
            Type.Object({
               overwrite: Type.Optional(booleanLike)
            })
         ),
         uploadSizeMiddleware,
         async (c) => {
            const entity_name = c.req.param("entity");
            const field_name = c.req.param("field");
            const entity_id = Number.parseInt(c.req.param("id"));
            console.log("params", { entity_name, field_name, entity_id });

            // check if entity exists
            const entity = this.media.em.entity(entity_name);
            if (!entity) {
               return c.json({ error: `Entity "${entity_name}" not found` }, 404);
            }

            // check if field exists and is of type MediaField
            const field = entity.field(field_name);
            if (!field || !(field instanceof MediaField)) {
               return c.json({ error: `Invalid field "${field_name}"` }, 400);
            }

            const mediaEntity = this.media.getMediaEntity();
            const reference = `${entity_name}.${field_name}`;
            const mediaRef = {
               scope: field_name,
               reference,
               entity_id: entity_id
            };

            // check max items
            const max_items = field.getMaxItems();
            const ids_to_delete: number[] = [];
            const id_field = mediaEntity.getPrimaryField().name;
            if (max_items) {
               const { overwrite } = c.req.valid("query");
               const { count } = await this.media.em.repository(mediaEntity).count(mediaRef);

               // if there are more than or equal to max items
               if (count >= max_items) {
                  // if overwrite not set, abort early
                  if (!overwrite) {
                     return c.json({ error: `Max items (${max_items}) reached` }, 400);
                  }

                  // if already more in database than allowed, abort early
                  // because we don't know if we can delete multiple items
                  if (count > max_items) {
                     return c.json(
                        { error: `Max items (${max_items}) exceeded already with ${count} items.` },
                        400
                     );
                  }

                  // collect items to delete
                  const deleteRes = await this.media.em.repo(mediaEntity).findMany({
                     select: [id_field],
                     where: mediaRef,
                     sort: {
                        by: id_field,
                        dir: "asc"
                     },
                     limit: count - max_items + 1
                  });

                  if (deleteRes.data && deleteRes.data.length > 0) {
                     deleteRes.data.map((item) => ids_to_delete.push(item[id_field]));
                  }
               }
            }

            // check if entity exists in database
            const { exists } = await this.media.em.repository(entity).exists({ id: entity_id });
            if (!exists) {
               return c.json(
                  { error: `Entity "${entity_name}" with ID "${entity_id}" doesn't exist found` },
                  404
               );
            }

            const file = await this.getStorage().getFileFromRequest(c);
            const file_name = getRandomizedFilename(file as File);
            const info = await this.getStorage().uploadFile(file, file_name, true);

            const mutator = this.media.em.mutator(mediaEntity);
            mutator.__unstable_toggleSystemEntityCreation(false);
            const result = await mutator.insertOne({
               ...this.media.uploadedEventDataToMediaPayload(info),
               ...mediaRef
            });
            mutator.__unstable_toggleSystemEntityCreation(true);

            // delete items if needed
            if (ids_to_delete.length > 0) {
               await this.media.em
                  .mutator(mediaEntity)
                  .deleteMany({ [id_field]: { $in: ids_to_delete } });
            }

            return c.json({ ok: true, result: result.data, ...info });
         }
      );

      return hono;
   }
}
