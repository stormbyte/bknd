import { afterAll, describe, expect, test } from "bun:test";
import { App } from "../src";
import { getDummyConnection } from "./helper";

const { dummyConnection, afterAllCleanup } = getDummyConnection();
afterAll(afterAllCleanup);

describe("App tests", async () => {
   test("boots and pongs", async () => {
      const app = new App(dummyConnection);
      await app.build();

      //expect(await app.data?.em.ping()).toBeTrue();
   });
});
