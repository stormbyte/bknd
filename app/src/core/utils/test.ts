type ConsoleSeverity = "log" | "warn" | "error";
const _oldConsoles = {
   log: console.log,
   warn: console.warn,
   error: console.error
};

export async function withDisabledConsole<R>(
   fn: () => Promise<R>,
   severities: ConsoleSeverity[] = ["log"]
): Promise<R> {
   const enable = disableConsoleLog(severities);
   const result = await fn();
   enable();
   return result;
}

export function disableConsoleLog(severities: ConsoleSeverity[] = ["log"]) {
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
