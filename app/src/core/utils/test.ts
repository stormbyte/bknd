type ConsoleSeverity = "log" | "warn" | "error";
const _oldConsoles = {
   log: console.log,
   warn: console.warn,
   error: console.error
};

export function disableConsoleLog(severities: ConsoleSeverity[] = ["log"]) {
   severities.forEach((severity) => {
      console[severity] = () => null;
   });
}

export function enableConsoleLog() {
   Object.entries(_oldConsoles).forEach(([severity, fn]) => {
      console[severity as ConsoleSeverity] = fn;
   });
}
