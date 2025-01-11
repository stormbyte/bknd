type ConsoleSeverity = "log" | "warn" | "error";
const _oldConsoles = {
   log: console.log,
   warn: console.warn,
   error: console.error
};

export async function withDisabledConsole<R>(
   fn: () => Promise<R>,
   severities: ConsoleSeverity[] = ["log", "warn", "error"]
): Promise<R> {
   const _oldConsoles = {
      log: console.log,
      warn: console.warn,
      error: console.error
   };
   disableConsoleLog(severities);
   const enable = () => {
      Object.entries(_oldConsoles).forEach(([severity, fn]) => {
         console[severity as ConsoleSeverity] = fn;
      });
   };
   try {
      const result = await fn();
      enable();
      return result;
   } catch (e) {
      enable();
      throw e;
   }
}

export function disableConsoleLog(severities: ConsoleSeverity[] = ["log", "warn"]) {
   severities.forEach((severity) => {
      console[severity] = () => null;
   });
   return enableConsoleLog;
}

export function enableConsoleLog() {
   Object.entries(_oldConsoles).forEach(([severity, fn]) => {
      console[severity as ConsoleSeverity] = fn;
   });
}
