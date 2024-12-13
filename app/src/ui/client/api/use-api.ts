import type { Api } from "Api";
import type { FetchPromise, ResponseObject } from "modules/ModuleApi";
import useSWR, { type SWRConfiguration } from "swr";
import { useClient } from "ui/client/ClientProvider";

export const useApi = () => {
   const client = useClient();
   return client.api;
};

export const useApiQuery = <
   Data,
   RefineFn extends (data: ResponseObject<Data>) => any = (data: ResponseObject<Data>) => Data
>(
   fn: (api: Api) => FetchPromise<Data>,
   options?: SWRConfiguration & { enabled?: boolean; refine?: RefineFn }
) => {
   const api = useApi();
   const promise = fn(api);
   const refine = options?.refine ?? ((data: ResponseObject<Data>) => data);
   const fetcher = () => promise.execute().then(refine);
   const key = promise.key();

   type RefinedData = RefineFn extends (data: Data) => infer R ? R : Data;

   const swr = useSWR<RefinedData>(options?.enabled === false ? null : key, fetcher, options);
   return {
      ...swr,
      promise,
      key,
      api
   };
};
