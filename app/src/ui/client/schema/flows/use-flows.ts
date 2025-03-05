import { type Static, parse } from "core/utils";
import { type TAppFlowSchema, flowSchema } from "flows/flows-schema";
import { useBknd } from "../../BkndProvider";

export function useFlows() {
   const { config, app, actions: bkndActions } = useBknd();

   const actions = {
      flow: {
         create: async (name: string, data: TAppFlowSchema) => {
            console.log("would create", name, data);
            const parsed = parse(flowSchema, data, { skipMark: true, forceParse: true });
            console.log("parsed", parsed);
            const res = await bkndActions.add("flows", `flows.${name}`, parsed);
            console.log("res", res);
         },
      },
   };

   return { flows: app.flows, config: config.flows, actions };
}
