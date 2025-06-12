import { connectionTestSuite } from "../connection-test-suite";
import { LibsqlConnection } from "./LibsqlConnection";
import { bunTestRunner } from "adapter/bun/test";
import { describe } from "bun:test";

describe("LibsqlConnection", () => {
   connectionTestSuite(bunTestRunner, {
      makeConnection: () => new LibsqlConnection({ url: ":memory:" }),
      rawDialectDetails: ["rowsAffected", "lastInsertRowid"],
   });
});
