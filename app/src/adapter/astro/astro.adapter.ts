import { type FrameworkBkndConfig, createFrameworkApp } from "adapter";
import { Api, type ApiOptions, type App } from "bknd";

export type AstroBkndConfig = FrameworkBkndConfig;

type TAstro = {
   request: Request;
};

export type Options = {
   mode?: "static" | "dynamic";
} & Omit<ApiOptions, "host"> & {
      host?: string;
   };

export function getApi(Astro: TAstro, options: Options = { mode: "static" }) {
   return new Api({
      host: new URL(Astro.request.url).origin,
      headers: options.mode === "dynamic" ? Astro.request.headers : undefined
   });
}

let app: App;
export function serve(config: AstroBkndConfig = {}) {
   return async (args: TAstro) => {
      if (!app) {
         app = await createFrameworkApp(config);
      }
      return app.fetch(args.request);
   };
}
