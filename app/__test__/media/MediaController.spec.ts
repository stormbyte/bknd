import { describe, test } from "bun:test";
import { Hono } from "hono";
import { Guard } from "../../src/auth";
import { EventManager } from "../../src/core/events";
import { EntityManager } from "../../src/data";
import { AppMedia } from "../../src/media/AppMedia";
import { MediaController } from "../../src/media/api/MediaController";
import { getDummyConnection } from "../helper";

const { dummyConnection, afterAllCleanup } = getDummyConnection();

/**
 * R2
 *     value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob | null,
 * Node writefile
 * data: string | NodeJS.ArrayBufferView | Iterable<string | NodeJS.ArrayBufferView> | AsyncIterable<string | NodeJS.ArrayBufferView> | Stream,
 */
const ALL_TESTS = !!process.env.ALL_TESTS;
describe.skipIf(ALL_TESTS)("MediaController", () => {
   test("..", async () => {
      const ctx: any = {
         em: new EntityManager([], dummyConnection, []),
         guard: new Guard(),
         emgr: new EventManager(),
         server: new Hono()
      };

      const media = new AppMedia(
         // @ts-ignore
         {
            enabled: true,
            adapter: {
               type: "s3",
               config: {
                  access_key: process.env.R2_ACCESS_KEY as string,
                  secret_access_key: process.env.R2_SECRET_ACCESS_KEY as string,
                  url: process.env.R2_URL as string
               }
            }
         },
         ctx
      );
      await media.build();
      const app = new MediaController(media).getController();

      const file = Bun.file(`${import.meta.dir}/adapters/icon.png`);
      console.log("file", file);
      const form = new FormData();
      form.append("file", file);

      await app.request("/upload/test.png", {
         method: "POST",
         body: file
      });
   });
});
