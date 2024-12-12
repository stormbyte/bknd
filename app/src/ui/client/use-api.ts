import type { Api } from "Api";
import type { FetchPromise } from "modules/ModuleApi";
import useSWR, { type SWRConfiguration } from "swr";
import { useClient } from "ui/client/ClientProvider";

export const useApi = () => {
   const client = useClient();
   return client.api;
};

export const useApiQuery = <T = any>(
   fn: (api: Api) => FetchPromise<T>,
   options?: SWRConfiguration & { enabled?: boolean }
) => {
   const api = useApi();
   const p = fn(api);
   return useSWR<T>(options?.enabled === false ? null : p.getKey(), () => p, options);
};
