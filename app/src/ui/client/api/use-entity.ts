import type { PrimaryFieldType } from "core";
import { objectTransform } from "core/utils";
import type { EntityData, RepoQuery } from "data";
import type { ResponseObject } from "modules/ModuleApi";
import useSWR, { type SWRConfiguration } from "swr";
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

export const useEntity = <
   Entity extends string,
   Id extends PrimaryFieldType | undefined = undefined
>(
   entity: Entity,
   id?: Id
) => {
   const api = useApi().data;

   return {
      create: async (input: EntityData) => {
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
         return res;
      },
      update: async (input: Partial<EntityData>, _id: PrimaryFieldType | undefined = id) => {
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

export const useEntityQuery = <
   Entity extends string,
   Id extends PrimaryFieldType | undefined = undefined
>(
   entity: Entity,
   id?: Id,
   query?: Partial<RepoQuery>,
   options?: SWRConfiguration & { enabled?: boolean }
) => {
   const api = useApi().data;
   const key =
      options?.enabled !== false
         ? [...(api.options?.basepath?.split("/") ?? []), entity, ...(id ? [id] : [])].filter(
              Boolean
           )
         : null;
   const { read, ...actions } = useEntity(entity, id) as any;
   const fetcher = () => read(query);

   type T = Awaited<ReturnType<(typeof api)[Id extends undefined ? "readMany" : "readOne"]>>;
   const swr = useSWR<T>(key, fetcher, {
      revalidateOnFocus: false,
      keepPreviousData: false,
      ...options
   });

   const mapped = objectTransform(actions, (action) => {
      if (action === "read") return;

      return async (...args) => {
         return swr.mutate(action(...args)) as any;
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
   Entity extends string,
   Id extends PrimaryFieldType | undefined = undefined
>(
   entity: Entity,
   id?: Id,
   options?: SWRConfiguration
) => {
   const { data, ...$q } = useEntityQuery(entity, id, undefined, {
      ...options,
      enabled: false
   });
   return $q;
};
