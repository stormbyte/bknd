import type { Api } from "Api";
import type { FetchPromise, ModuleApi, ResponseObject } from "modules/ModuleApi";
import useSWR, { type SWRConfiguration, useSWRConfig } from "swr";
import { useApi } from "ui/client";

export const useApiQuery = <
   Data,
   RefineFn extends (data: ResponseObject<Data>) => unknown = (data: ResponseObject<Data>) => Data
>(
   fn: (api: Api) => FetchPromise<Data>,
   options?: SWRConfiguration & { enabled?: boolean; refine?: RefineFn }
) => {
   const api = useApi();
   const promise = fn(api);
   const refine = options?.refine ?? ((data: any) => data);
   const fetcher = () => promise.execute().then(refine);
   const key = promise.key();

   type RefinedData = RefineFn extends (data: ResponseObject<Data>) => infer R ? R : Data;

   const swr = useSWR<RefinedData>(options?.enabled === false ? null : key, fetcher, options);
   return {
      ...swr,
      promise,
      key,
      api
   };
};

export const useInvalidate = (options?: { exact?: boolean }) => {
   const mutate = useSWRConfig().mutate;
   const api = useApi();

   return async (arg?: string | ((api: Api) => FetchPromise<any> | ModuleApi<any>)) => {
      let key = "";
      if (typeof arg === "string") {
         key = arg;
      } else if (typeof arg === "function") {
         key = arg(api).key();
      }

      if (options?.exact) return mutate(key);
      return mutate((k) => typeof k === "string" && k.startsWith(key));
   };
};
