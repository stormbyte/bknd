import {
   type AliasableExpression,
   type DatabaseIntrospector,
   type Expression,
   type Kysely,
   type KyselyPlugin,
   type RawBuilder,
   type SelectQueryBuilder,
   type SelectQueryNode,
   type Simplify,
   sql
} from "kysely";

export type QB = SelectQueryBuilder<any, any, any>;

export type IndexMetadata = {
   name: string;
   table: string;
   isUnique: boolean;
   columns: { name: string; order: number }[];
};

export interface ConnectionIntrospector extends DatabaseIntrospector {
   getIndices(tbl_name?: string): Promise<IndexMetadata[]>;
}

export interface SelectQueryBuilderExpression<O> extends AliasableExpression<O> {
   get isSelectQueryBuilder(): true;
   toOperationNode(): SelectQueryNode;
}

export type DbFunctions = {
   jsonObjectFrom<O>(expr: SelectQueryBuilderExpression<O>): RawBuilder<Simplify<O> | null>;
   jsonArrayFrom<O>(expr: SelectQueryBuilderExpression<O>): RawBuilder<Simplify<O>[]>;
   jsonBuildObject<O extends Record<string, Expression<unknown>>>(
      obj: O
   ): RawBuilder<
      Simplify<{
         [K in keyof O]: O[K] extends Expression<infer V> ? V : never;
      }>
   >;
};

export abstract class Connection {
   kysely: Kysely<any>;

   constructor(
      kysely: Kysely<any>,
      public fn: Partial<DbFunctions> = {},
      protected plugins: KyselyPlugin[] = []
   ) {
      this.kysely = kysely;
   }

   getIntrospector(): ConnectionIntrospector {
      return this.kysely.introspection as ConnectionIntrospector;
   }

   supportsBatching(): boolean {
      return false;
   }

   supportsIndices(): boolean {
      return false;
   }

   async ping(): Promise<boolean> {
      const res = await sql`SELECT 1`.execute(this.kysely);
      return res.rows.length > 0;
   }

   protected async batch<Queries extends QB[]>(
      queries: [...Queries]
   ): Promise<{
      [K in keyof Queries]: Awaited<ReturnType<Queries[K]["execute"]>>;
   }> {
      throw new Error("Batching not supported");
   }

   async batchQuery<Queries extends QB[]>(
      queries: [...Queries]
   ): Promise<{
      [K in keyof Queries]: Awaited<ReturnType<Queries[K]["execute"]>>;
   }> {
      // bypass if no client support
      if (!this.supportsBatching()) {
         const data: any = [];
         for (const q of queries) {
            const result = await q.execute();
            data.push(result);
         }
         return data;
      }

      return await this.batch(queries);
   }
}
