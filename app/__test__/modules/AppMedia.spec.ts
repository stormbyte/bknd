import { describe } from "bun:test";
import { AppMedia } from "../../src/modules";
import { moduleTestSuite } from "./module-test-suite";

describe("AppMedia", () => {
   moduleTestSuite(AppMedia);
});
