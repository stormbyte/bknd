import { datetimeStringLocal } from "core/utils";
import colors from "picocolors";
import { env } from "core";

function hasColors() {
   try {
      // biome-ignore lint/style/useSingleVarDeclarator: <explanation>
      const p = process || {},
         argv = p.argv || [],
         env = p.env || {};
      return (
         !(!!env.NO_COLOR || argv.includes("--no-color")) &&
         (!!env.FORCE_COLOR ||
            argv.includes("--color") ||
            p.platform === "win32" ||
            // biome-ignore lint/complexity/useOptionalChain: <explanation>
            ((p.stdout || {}).isTTY && env.TERM !== "dumb") ||
            !!env.CI)
      );
   } catch (e) {
      return false;
   }
}

const __consoles = {
   error: {
      prefix: "ERR",
      color: colors.red,
      args_color: colors.red,
      original: console.error,
   },
   warn: {
      prefix: "WRN",
      color: colors.yellow,
      args_color: colors.yellow,
      original: console.warn,
   },
   info: {
      prefix: "INF",
      color: colors.cyan,
      original: console.info,
   },
   log: {
      prefix: "LOG",
      color: colors.dim,
      args_color: colors.dim,
      original: console.log,
   },
   debug: {
      prefix: "DBG",
      color: colors.yellow,
      args_color: colors.dim,
      original: console.debug,
   },
} as const;

function __tty(_type: any, args: any[]) {
   const has = hasColors();
   const cons = __consoles[_type];
   const prefix = cons.color(`[${cons.prefix}]`);
   const _args = args.map((a) =>
      "args_color" in cons && has && typeof a === "string" ? cons.args_color(a) : a,
   );
   return cons.original(prefix, colors.gray(datetimeStringLocal()), ..._args);
}

export type TConsoleSeverity = keyof typeof __consoles;
const level = env("cli_log_level", "log");

const keys = Object.keys(__consoles);
export const $console = new Proxy(
   {},
   {
      get: (_, prop) => {
         if (prop === "original") {
            return console;
         }

         const current = keys.indexOf(level as string);
         const requested = keys.indexOf(prop as string);
         if (prop in __consoles && requested <= current) {
            return (...args: any[]) => __tty(prop, args);
         }
         return () => null;
      },
   },
) as typeof console & {
   original: typeof console;
};

export function colorizeConsole(con: typeof console) {
   for (const [key] of Object.entries(__consoles)) {
      con[key] = $console[key];
   }
}
