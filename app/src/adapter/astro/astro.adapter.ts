import { type FrameworkBkndConfig, createFrameworkApp } from "adapter";
import { Api, type ApiOptions, type App } from "bknd";

export type AstroBkndConfig<Args = TAstro> = FrameworkBkndConfig<Args>;

type TAstro = {
   request: Request;
};

export type Options = {
   mode?: "static" | "dynamic";
} & Omit<ApiOptions, "host"> & {
      host?: string;
   };

export async function getApi(Astro: TAstro, options: Options = { mode: "static" }) {
   const api = new Api({
      host: new URL(Astro.request.url).origin,
      headers: options.mode === "dynamic" ? Astro.request.headers : undefined
   });
   await api.verifyAuth();
   return api;
}

let app: App;
export function serve<Context extends TAstro = TAstro>(config: AstroBkndConfig<Context> = {}) {
   return async (args: Context) => {
      console.log("args", Object.keys(args));
      if (!app) {
         app = await createFrameworkApp(config, args);
      }
      return app.fetch(args.request);
   };
}
