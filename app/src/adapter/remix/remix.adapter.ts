import { App, type CreateAppConfig } from "bknd";

let app: App;
export function serve(config: CreateAppConfig) {
   return async (args: { request: Request }) => {
      if (!app) {
         app = App.create(config);
         await app.build();
      }
      return app.fetch(args.request);
   };
}
