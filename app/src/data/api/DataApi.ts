import type { EntityData, RepoQuery, RepositoryResponse } from "data";
import { type BaseModuleApiOptions, ModuleApi, type PrimaryFieldType } from "modules";

export type DataApiOptions = BaseModuleApiOptions & {
   defaultQuery?: Partial<RepoQuery>;
};

export class DataApi extends ModuleApi<DataApiOptions> {
   protected override getDefaultOptions(): Partial<DataApiOptions> {
      return {
         basepath: "/api/data",
         defaultQuery: {
            limit: 10
         }
      };
   }

   readOne(
      entity: string,
      id: PrimaryFieldType,
      query: Partial<Omit<RepoQuery, "where" | "limit" | "offset">> = {}
   ) {
      return this.get<RepositoryResponse<EntityData>>([entity, id], query);
   }

   readMany(entity: string, query: Partial<RepoQuery> = {}) {
      return this.get<Pick<RepositoryResponse, "meta" | "data">>(
         [entity],
         query ?? this.options.defaultQuery
      );
   }

   readManyByReference(
      entity: string,
      id: PrimaryFieldType,
      reference: string,
      query: Partial<RepoQuery> = {}
   ) {
      return this.get<Pick<RepositoryResponse, "meta" | "data">>(
         [entity, id, reference],
         query ?? this.options.defaultQuery
      );
   }

   createOne(entity: string, input: EntityData) {
      return this.post<RepositoryResponse<EntityData>>([entity], input);
   }

   updateOne(entity: string, id: PrimaryFieldType, input: EntityData) {
      return this.patch<RepositoryResponse<EntityData>>([entity, id], input);
   }

   deleteOne(entity: string, id: PrimaryFieldType) {
      return this.delete<RepositoryResponse<EntityData>>([entity, id]);
   }

   count(entity: string, where: RepoQuery["where"] = {}) {
      return this.post<RepositoryResponse<{ entity: string; count: number }>>(
         [entity, "fn", "count"],
         where
      );
   }
}
