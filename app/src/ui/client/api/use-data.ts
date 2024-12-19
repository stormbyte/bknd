import type { DataApi } from "data/api/DataApi";
import { useApi } from "ui/client";

type OmitFirstArg<F> = F extends (x: any, ...args: infer P) => any
   ? (...args: P) => ReturnType<F>
   : never;

/**
 * Maps all DataApi functions and omits
 * the first argument "entity" for convenience
 * @param entity
 */
export const useData = <T extends keyof DataApi<DB>>(entity: string) => {
   const api = useApi().data;
   const methods = [
      "readOne",
      "readMany",
      "readManyByReference",
      "createOne",
      "updateOne",
      "deleteOne"
   ] as const;

   return methods.reduce(
      (acc, method) => {
         // @ts-ignore
         acc[method] = (...params) => {
            // @ts-ignore
            return api[method](entity, ...params);
         };
         return acc;
      },
      {} as {
         [K in (typeof methods)[number]]: OmitFirstArg<(typeof api)[K]>;
      }
   );
};
