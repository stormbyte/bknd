import { Api, type ApiOptions } from "bknd";

type TAstro = {
   request: {
      url: string;
      headers: Headers;
   };
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
