import type { PrimaryFieldType } from "core";
import { objectTransform } from "core/utils";
import type { EntityData, RepoQuery } from "data";
import useSWR, { type SWRConfiguration } from "swr";
import { useApi } from "ui/client";

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
         return res.data;
      },
      read: async (query: Partial<RepoQuery> = {}) => {
         const res = id ? await api.readOne(entity, id!, query) : await api.readMany(entity, query);
         return res.data;
      },
      update: async (input: Partial<EntityData>, _id: PrimaryFieldType | undefined = id) => {
         if (!_id) {
            throw new Error("id is required");
         }
         const res = await api.updateOne(entity, _id, input);
         return res.data;
      },
      _delete: async (_id: PrimaryFieldType | undefined = id) => {
         if (!_id) {
            throw new Error("id is required");
         }

         const res = await api.deleteOne(entity, _id);
         return res.data;
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
   options?: SWRConfiguration
) => {
   const api = useApi().data;
   const key = [...(api.options?.basepath?.split("/") ?? []), entity, ...(id ? [id] : [])].filter(
      Boolean
   );
   const { read, ...actions } = useEntity(entity, id) as any;
   const fetcher = id ? () => read(query) : () => null;
   const swr = useSWR<EntityData>(id ? key : null, fetcher, options);

   const mapped = objectTransform(actions, (action) => {
      if (action === "read") return;

      return async (...args) => {
         return swr.mutate(async () => {
            const res = await action(...args);
            return res;
         });
      };
   }) as Omit<ReturnType<typeof useEntity<Entity, Id>>, "read">;

   return {
      ...swr,
      ...mapped,
      key
   };
};
