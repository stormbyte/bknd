import { isDebug } from "core";
import c from "picocolors";
import type { Formatter } from "picocolors/types";
const _SPEEDUP = process.env.LOCAL;

const DEFAULT_WAIT = _SPEEDUP ? 0 : 250;
export async function wait(factor: number = 1, strict?: boolean) {
   const ms = strict === true ? factor : DEFAULT_WAIT * factor;
   return new Promise((r) => setTimeout(r, ms));
}

// from https://github.com/chalk/ansi-regex/blob/main/index.js
export default function ansiRegex({ onlyFirst = false } = {}) {
   // Valid string terminator sequences are BEL, ESC\, and 0x9c
   const ST = "(?:\\u0007|\\u001B\\u005C|\\u009C)";
   const pattern = [
      `[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?${ST})`,
      "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))"
   ].join("|");

   return new RegExp(pattern, onlyFirst ? undefined : "g");
}

const DEFAULT_WAIT_WRITER = _SPEEDUP ? 0 : 20;
export async function* typewriter(
   text: string,
   transform?: (char: string) => string,
   _delay?: number
) {
   const delay = DEFAULT_WAIT_WRITER * (_delay ?? 1);
   const regex = ansiRegex();
   const parts: string[] = [];
   let match: RegExpExecArray | null;
   let lastIndex = 0;

   // Extract ANSI escape sequences as standalone units
   // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
   while ((match = regex.exec(text)) !== null) {
      if (lastIndex < match.index) {
         parts.push(...text.slice(lastIndex, match.index).split(""));
      }
      parts.push(match[0]); // Add the ANSI escape sequence as a full chunk
      lastIndex = regex.lastIndex;
   }

   // Add any remaining characters after the last ANSI sequence
   if (lastIndex < text.length) {
      parts.push(...text.slice(lastIndex).split(""));
   }

   // Yield characters or ANSI sequences in order
   for (const chunk of parts) {
      yield transform ? transform(chunk) : chunk;
      // Delay only for normal characters, not ANSI codes
      if (!regex.test(chunk)) {
         await wait(delay, true);
      }
   }
}

function ifString(args: any[], c: Formatter) {
   return args.map((a) => (typeof a === "string" ? c(a) : a));
}

const originalConsole = {
   log: console.log,
   info: console.info,
   debug: console.debug,
   warn: console.warn,
   error: console.error
};

export const $console = {
   log: (...args: any[]) => originalConsole.info(c.gray("[LOG]  "), ...ifString(args, c.dim)),
   info: (...args: any[]) => originalConsole.info(c.cyan("[INFO] "), ...args),
   debug: (...args: any[]) => isDebug() && originalConsole.info(c.yellow("[DEBUG]"), ...args),
   warn: (...args: any[]) => originalConsole.info(c.yellow("[WARN] "), ...ifString(args, c.yellow)),
   error: (...args: any[]) => originalConsole.info(c.red("[ERROR]"), ...ifString(args, c.red))
};

export function replaceConsole() {
   console.log = $console.log;
   console.info = $console.info;
   console.debug = $console.debug;
   console.warn = $console.warn;
   console.error = $console.error;
}
