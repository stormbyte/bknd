import type { App } from "bknd";
import { type FrameworkBkndConfig, createFrameworkApp } from "bknd/adapter";

type ReactRouterContext = {
   request: Request;
};
export type ReactRouterBkndConfig<Args = ReactRouterContext> = FrameworkBkndConfig<Args>;

let app: App;
let building: boolean = false;

export async function getApp<Args extends ReactRouterContext = ReactRouterContext>(
   config: ReactRouterBkndConfig<Args>,
   args?: Args,
) {
   if (building) {
      while (building) {
         await new Promise((resolve) => setTimeout(resolve, 5));
      }
      if (app) return app;
   }

   building = true;
   if (!app) {
      app = await createFrameworkApp(config, args);
      await app.build();
   }
   building = false;
   return app;
}

export function serve<Args extends ReactRouterContext = ReactRouterContext>(
   config: ReactRouterBkndConfig<Args> = {},
) {
   return async (args: Args) => {
      app = await getApp(config, args);
      return app.fetch(args.request);
   };
}
