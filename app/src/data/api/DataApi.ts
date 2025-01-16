import type { DB } from "core";
import type { EntityData, RepoQuery, RepoQueryIn, RepositoryResponse } from "data";
import { type BaseModuleApiOptions, ModuleApi, type PrimaryFieldType } from "modules";

export type DataApiOptions = BaseModuleApiOptions & {
   queryLengthLimit: number;
   defaultQuery: Partial<RepoQuery>;
};

export class DataApi extends ModuleApi<DataApiOptions> {
   protected override getDefaultOptions(): Partial<DataApiOptions> {
      return {
         basepath: "/api/data",
         queryLengthLimit: 1000,
         defaultQuery: {
            limit: 10
         }
      };
   }

   readOne<E extends keyof DB | string, Data = E extends keyof DB ? DB[E] : EntityData>(
      entity: E,
      id: PrimaryFieldType,
      query: Omit<RepoQueryIn, "where" | "limit" | "offset"> = {}
   ) {
      return this.get<Pick<RepositoryResponse<Data>, "meta" | "data">>([entity as any, id], query);
   }

   readMany<E extends keyof DB | string, Data = E extends keyof DB ? DB[E] : EntityData>(
      entity: E,
      query: RepoQueryIn = {}
   ) {
      type T = Pick<RepositoryResponse<Data[]>, "meta" | "data">;

      const input = query ?? this.options.defaultQuery;
      const exceeds = JSON.stringify([entity, input]).length > this.options.queryLengthLimit;

      if (exceeds) {
         return this.post<T>([entity as any, "query"], input);
      }

      return this.get<T>([entity as any], input);
   }

   readManyByReference<
      E extends keyof DB | string,
      R extends keyof DB | string,
      Data = R extends keyof DB ? DB[R] : EntityData
   >(entity: E, id: PrimaryFieldType, reference: R, query: RepoQueryIn = {}) {
      return this.get<Pick<RepositoryResponse<Data[]>, "meta" | "data">>(
         [entity as any, id, reference],
         query ?? this.options.defaultQuery
      );
   }

   createOne<E extends keyof DB | string, Data = E extends keyof DB ? DB[E] : EntityData>(
      entity: E,
      input: Omit<Data, "id">
   ) {
      return this.post<RepositoryResponse<Data>>([entity as any], input);
   }

   updateOne<E extends keyof DB | string, Data = E extends keyof DB ? DB[E] : EntityData>(
      entity: E,
      id: PrimaryFieldType,
      input: Partial<Omit<Data, "id">>
   ) {
      return this.patch<RepositoryResponse<Data>>([entity as any, id], input);
   }

   deleteOne<E extends keyof DB | string, Data = E extends keyof DB ? DB[E] : EntityData>(
      entity: E,
      id: PrimaryFieldType
   ) {
      return this.delete<RepositoryResponse<Data>>([entity as any, id]);
   }

   count<E extends keyof DB | string>(entity: E, where: RepoQuery["where"] = {}) {
      return this.post<RepositoryResponse<{ entity: E; count: number }>>(
         [entity as any, "fn", "count"],
         where
      );
   }
}
