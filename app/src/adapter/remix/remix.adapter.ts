import { App, type CreateAppConfig } from "bknd";

let app: App;
export function serve(config: CreateAppConfig & { beforeBuild?: (app: App) => Promise<void> }) {
   return async (args: { request: Request }) => {
      if (!app) {
         app = App.create(config);
         await config.beforeBuild?.(app);
         await app.build();
      }
      return app.fetch(args.request);
   };
}
