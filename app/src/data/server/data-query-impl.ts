import type { TThis } from "@sinclair/typebox";
import {
   type SchemaOptions,
   type Static,
   type StaticDecode,
   StringEnum,
   Type,
   Value
} from "core/utils";
import { WhereBuilder, type WhereQuery } from "../entities";

const NumberOrString = (options: SchemaOptions = {}) =>
   Type.Transform(Type.Union([Type.Number(), Type.String()], options))
      .Decode((value) => Number.parseInt(String(value)))
      .Encode(String);

const limit = NumberOrString({ default: 10 });
const offset = NumberOrString({ default: 0 });

const sort_default = { by: "id", dir: "asc" };
const sort = Type.Transform(
   Type.Union(
      [Type.String(), Type.Object({ by: Type.String(), dir: StringEnum(["asc", "desc"]) })],
      {
         default: sort_default
      }
   )
)
   .Decode((value): { by: string; dir: "asc" | "desc" } => {
      if (typeof value === "string") {
         if (/^-?[a-zA-Z_][a-zA-Z0-9_.]*$/.test(value)) {
            const dir = value[0] === "-" ? "desc" : "asc";
            return { by: dir === "desc" ? value.slice(1) : value, dir } as any;
         } else if (/^{.*}$/.test(value)) {
            return JSON.parse(value) as any;
         }

         return sort_default as any;
      }
      return value as any;
   })
   .Encode((value) => value);

const stringArray = Type.Transform(
   Type.Union([Type.String(), Type.Array(Type.String())], { default: [] })
)
   .Decode((value) => {
      if (Array.isArray(value)) {
         return value;
      } else if (value.includes(",")) {
         return value.split(",");
      }
      return [value];
   })
   .Encode((value) => (Array.isArray(value) ? value : [value]));

export const whereSchema = Type.Transform(
   Type.Union([Type.String(), Type.Object({})], { default: {} })
)
   .Decode((value) => {
      const q = typeof value === "string" ? JSON.parse(value) : value;
      return WhereBuilder.convert(q);
   })
   .Encode(JSON.stringify);

export type RepoWithSchema = Record<
   string,
   Omit<RepoQueryIn, "with"> & {
      with?: unknown;
   }
>;

export const withSchema = <TSelf extends TThis>(Self: TSelf) =>
   Type.Transform(Type.Union([stringArray, Type.Record(Type.String(), Self)]))
      .Decode((value) => {
         let _value = typeof value === "string" ? [value] : value;

         if (Array.isArray(value)) {
            if (!value.every((v) => typeof v === "string")) {
               throw new Error("Invalid 'with' schema");
            }

            _value = value.reduce((acc, v) => {
               acc[v] = {};
               return acc;
            }, {} as RepoWithSchema);
         }

         return _value as RepoWithSchema;
      })
      .Encode((value) => value);

export const querySchema = Type.Recursive(
   (Self) =>
      Type.Partial(
         Type.Object(
            {
               limit: limit,
               offset: offset,
               sort: sort,
               select: stringArray,
               with: withSchema(Self),
               join: stringArray,
               where: whereSchema
            },
            {
               // @todo: determine if unknown is allowed, it's ignore anyway
               additionalProperties: false
            }
         )
      ),
   { $id: "query-schema" }
);

export type RepoQueryIn = {
   limit?: number;
   offset?: number;
   sort?: string | { by: string; dir: "asc" | "desc" };
   select?: string[];
   with?: string[] | Record<string, RepoQueryIn>;
   join?: string[];
   where?: WhereQuery;
};
export type RepoQuery = Required<StaticDecode<typeof querySchema>>;
export const defaultQuerySchema = Value.Default(querySchema, {}) as RepoQuery;
