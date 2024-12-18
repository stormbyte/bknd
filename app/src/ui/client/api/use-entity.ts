import type { PrimaryFieldType } from "core";
import { objectTransform } from "core/utils";
import type { EntityData, RepoQuery } from "data";
import type { ModuleApi, ResponseObject } from "modules/ModuleApi";
import useSWR, { type SWRConfiguration, useSWRConfig } from "swr";
import { useApi } from "ui/client";

export class UseEntityApiError<Payload = any> extends Error {
   constructor(
      public payload: Payload,
      public response: Response,
      message?: string
   ) {
      super(message ?? "UseEntityApiError");
   }
}

function Test() {
   const { read } = useEntity("users");
   async () => {
      const data = await read();
   };

   return null;
}

export const useEntity = <
   Entity extends keyof DB | string,
   Id extends PrimaryFieldType | undefined = undefined,
   Data = Entity extends keyof DB ? DB[Entity] : EntityData
>(
   entity: Entity,
   id?: Id
) => {
   const api = useApi().data;

   return {
      create: async (input: Omit<Data, "id">) => {
         const res = await api.createOne(entity, input);
         if (!res.ok) {
            throw new UseEntityApiError(res.data, res.res, "Failed to create entity");
         }
         return res;
      },
      read: async (query: Partial<RepoQuery> = {}) => {
         const res = id ? await api.readOne(entity, id!, query) : await api.readMany(entity, query);
         if (!res.ok) {
            throw new UseEntityApiError(res.data, res.res, "Failed to read entity");
         }
         // must be manually typed
         return res as unknown as Id extends undefined
            ? ResponseObject<Data[]>
            : ResponseObject<Data>;
      },
      update: async (input: Partial<Omit<Data, "id">>, _id: PrimaryFieldType | undefined = id) => {
         if (!_id) {
            throw new Error("id is required");
         }
         const res = await api.updateOne(entity, _id, input);
         if (!res.ok) {
            throw new UseEntityApiError(res.data, res.res, "Failed to update entity");
         }
         return res;
      },
      _delete: async (_id: PrimaryFieldType | undefined = id) => {
         if (!_id) {
            throw new Error("id is required");
         }

         const res = await api.deleteOne(entity, _id);
         if (!res.ok) {
            throw new UseEntityApiError(res.data, res.res, "Failed to delete entity");
         }
         return res;
      }
   };
};

export function makeKey(api: ModuleApi, entity: string, id?: PrimaryFieldType) {
   return (
      "/" +
      [...(api.options?.basepath?.split("/") ?? []), entity, ...(id ? [id] : [])]
         .filter(Boolean)
         .join("/")
   );
}

export const useEntityQuery = <
   Entity extends keyof DB | string,
   Id extends PrimaryFieldType | undefined = undefined
>(
   entity: Entity,
   id?: Id,
   query?: Partial<RepoQuery>,
   options?: SWRConfiguration & { enabled?: boolean }
) => {
   const { mutate } = useSWRConfig();
   const api = useApi().data;
   const key = makeKey(api, entity, id);
   const { read, ...actions } = useEntity<Entity, Id>(entity, id);
   const fetcher = () => read(query);

   type T = Awaited<ReturnType<typeof fetcher>>;
   const swr = useSWR<T>(options?.enabled === false ? null : key, fetcher as any, {
      revalidateOnFocus: false,
      keepPreviousData: false,
      ...options
   });

   const mapped = objectTransform(actions, (action) => {
      return async (...args: any) => {
         // @ts-ignore
         const res = await action(...args);

         // mutate the key + list key
         mutate(key);
         if (id) mutate(makeKey(api, entity));
         return res;
      };
   }) as Omit<ReturnType<typeof useEntity<Entity, Id>>, "read">;

   return {
      ...swr,
      ...mapped,
      api,
      key
   };
};

export const useEntityMutate = <
   Entity extends keyof DB | string,
   Id extends PrimaryFieldType | undefined = undefined
>(
   entity: Entity,
   id?: Id,
   options?: SWRConfiguration
) => {
   const { data, ...$q } = useEntityQuery<Entity, Id>(entity, id, undefined, {
      ...options,
      enabled: false
   });
   return $q;
};
