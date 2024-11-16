import type { UseQueryResult } from "@tanstack/react-query";
import type { RepoQuery } from "data";
import { useClient } from "../client";

export type EntityData = Record<string, any>;

export type EntityContainerRenderParams<Data extends EntityData = EntityData> = {
   data: Data | null;
   client: ReturnType<typeof useClient>;
   initialValues: object;
   raw: {
      fetch?: UseQueryResult;
   };
   status: {
      fetch: QueryStatus;
   };
   actions: {
      create(obj: any): any;
      update(obj: any): any;
      remove(): any;
   };
};

export type MutationStatus = {
   isLoading: boolean;
   isSuccess: boolean;
   isError: boolean;
};

export type QueryStatus = MutationStatus & {
   isUpdating: boolean;
};

export function getStatus(query?: UseQueryResult): QueryStatus {
   return {
      isLoading: query ? query.isPending : false,
      isUpdating: query ? !query.isInitialLoading && query.isFetching : false,
      isSuccess: query ? query.isSuccess : false,
      isError: query ? query.isError : false
   };
}

export type EntityContainerProps = {
   entity: string;
   id?: number;
};

type FetchOptions = {
   disabled?: boolean;
   query?: Partial<Omit<RepoQuery, "where" | "limit" | "offset">>;
};

// @todo: add option to disable fetches (for form updates)
// @todo: must return a way to indicate error!
export function useEntity<Data extends EntityData = EntityData>(
   entity: string,
   id?: number,
   options?: { fetch?: FetchOptions }
): EntityContainerRenderParams<Data> {
   const client = useClient();
   let data: any = null;

   const fetchQuery = id
      ? client.query().data.entity(entity).readOne(id, options?.fetch?.query)
      : undefined;
   const createMutation = id ? null : client.mutation.data.entity(entity).create();
   const updateMutation = id ? client.mutation.data.entity(entity).update(id) : undefined;
   const deleteMutation = id ? client.mutation.data.entity(entity).delete(id) : undefined;

   if (fetchQuery?.isSuccess) {
      data = fetchQuery.data?.body.data;
   }

   const initialValues = { one: 1 };

   function create(obj: any) {
      // biome-ignore lint/suspicious/noAsyncPromiseExecutor: <explanation>
      return new Promise(async (resolve, reject) => {
         await createMutation?.mutate(obj, {
            onSuccess: resolve,
            onError: reject
         });
      });
   }

   function update(obj: any) {
      // biome-ignore lint/suspicious/noAsyncPromiseExecutor: <explanation>
      return new Promise(async (resolve, reject) => {
         //await new Promise((r) => setTimeout(r, 4000));
         await updateMutation?.mutate(obj, {
            onSuccess: resolve,
            onError: reject
         });
      });
   }

   function remove() {
      // biome-ignore lint/suspicious/noAsyncPromiseExecutor: <explanation>
      return new Promise(async (resolve, reject) => {
         //await new Promise((r) => setTimeout(r, 4000));
         await deleteMutation?.mutate(undefined, {
            onSuccess: resolve,
            onError: reject
         });
      });
   }

   return {
      data,
      client,
      initialValues,
      actions: {
         create,
         update,
         remove
      },
      status: {
         fetch: getStatus(fetchQuery)
         //update: getMutationStatus(updateMutation),
      },
      raw: {
         fetch: fetchQuery
      }
   };
}

export function EntityContainer({
   entity,
   id,
   children
}: EntityContainerProps & { children(params: EntityContainerRenderParams): any }) {
   const params = useEntity(entity, id);
   return children(params);
}

export const Entity = EntityContainer;
