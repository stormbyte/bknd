import { describe, expect, test } from "bun:test";
import { env, is_toggled } from "core/env";

describe("env", () => {
   test("is_toggled", () => {
      expect(is_toggled("true")).toBe(true);
      expect(is_toggled("1")).toBe(true);
      expect(is_toggled("false")).toBe(false);
      expect(is_toggled("0")).toBe(false);
      expect(is_toggled(true)).toBe(true);
      expect(is_toggled(false)).toBe(false);
      expect(is_toggled(undefined)).toBe(false);
      expect(is_toggled(null)).toBe(false);
      expect(is_toggled(1)).toBe(true);
      expect(is_toggled(0)).toBe(false);
      expect(is_toggled("anything else")).toBe(false);
      expect(is_toggled(undefined, true)).toBe(true);
   });

   test("env()", () => {
      expect(env("cli_log_level", undefined, { source: {} })).toBeUndefined();
      expect(env("cli_log_level", undefined, { source: { BKND_CLI_LOG_LEVEL: "log" } })).toBe(
         "log" as any,
      );
      expect(env("cli_log_level", undefined, { source: { BKND_CLI_LOG_LEVEL: "LOG" } })).toBe(
         "log" as any,
      );
      expect(
         env("cli_log_level", undefined, { source: { BKND_CLI_LOG_LEVEL: "asdf" } }),
      ).toBeUndefined();

      expect(env("modules_debug", undefined, { source: {} })).toBeFalse();
      expect(env("modules_debug", undefined, { source: { BKND_MODULES_DEBUG: "1" } })).toBeTrue();
      expect(env("modules_debug", undefined, { source: { BKND_MODULES_DEBUG: "0" } })).toBeFalse();
   });
});
