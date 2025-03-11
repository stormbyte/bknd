import { useBknd } from "../client/BkndProvider";

/** @deprecated */
export function useFlows() {
   const { app } = useBknd();

   return {
      flows: app.flows,
      config: app.config.flows,
   };
}

/** @deprecated */
export function useFlow(name: string) {
   const { app } = useBknd();
   const flow = app.flows.find((f) => f.name === name);

   return {
      flow: flow!,
      config: app.config.flows[name],
   };
}
