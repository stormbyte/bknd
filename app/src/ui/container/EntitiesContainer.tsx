import type { UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { RepositoryResponse } from "data";
import type { RepoQuery } from "data";
import { useClient } from "../client";
import { type EntityData, type QueryStatus, getStatus } from "./EntityContainer";

export type RenderParams<Data extends EntityData = EntityData> = {
   data: Data[] | undefined;
   meta: RepositoryResponse["meta"] | undefined;
   status: {
      fetch: QueryStatus;
   };
   raw: {
      fetch: UseQueryResult;
   };
   actions: {
      create(obj: any): any;
      update(id: number, obj: any): any;
   };
};

export type EntitiesContainerProps = {
   entity: string;
   query?: Partial<RepoQuery>;
   queryOptions?: Partial<UseQueryOptions>;
};

export function useEntities(
   entity: string,
   query?: Partial<RepoQuery>,
   queryOptions?: Partial<UseQueryOptions>
): RenderParams {
   const client = useClient();
   let data: any = null;
   let meta: any = null;

   const fetchQuery = client.query(queryOptions).data.entity(entity).readMany(query);
   const createMutation = client.mutation.data.entity(entity).create();
   const updateMutation = (id: number) => client.mutation.data.entity(entity).update(id);

   if (fetchQuery?.isSuccess) {
      meta = fetchQuery.data?.body.meta;
      data = fetchQuery.data?.body.data;
   }

   function create(obj: any) {
      // biome-ignore lint/suspicious/noAsyncPromiseExecutor: <explanation>
      return new Promise(async (resolve, reject) => {
         await createMutation?.mutate(obj, {
            onSuccess: resolve,
            onError: reject
         });
      });
   }

   function update(id: number, obj: any) {
      // biome-ignore lint/suspicious/noAsyncPromiseExecutor: <explanation>
      return new Promise(async (resolve, reject) => {
         await updateMutation(id).mutate(obj, {
            onSuccess: resolve,
            onError: reject
         });
      });
   }

   return {
      data,
      meta,
      actions: {
         create,
         update
         // remove
      },
      status: {
         fetch: getStatus(fetchQuery)
      },
      raw: {
         fetch: fetchQuery
      }
   };
}

export function EntitiesContainer<Data extends EntityData = EntityData>({
   entity,
   query,
   queryOptions,
   children
}: EntitiesContainerProps & {
   children(params: RenderParams<Data>): any;
}) {
   const params = useEntities(entity, query, queryOptions);
   return children(params as any);
}

export const Entities = EntitiesContainer;
