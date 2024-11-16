import {
   type SchemaOptions,
   type Static,
   type StaticDecode,
   StringEnum,
   Type,
   Value
} from "core/utils";
import type { Simplify } from "type-fest";
import { WhereBuilder } from "../entities";

const NumberOrString = (options: SchemaOptions = {}) =>
   Type.Transform(Type.Union([Type.Number(), Type.String()], options))
      .Decode((value) => Number.parseInt(String(value)))
      .Encode(String);

const limit = NumberOrString({ default: 10 });

const offset = NumberOrString({ default: 0 });

// @todo: allow "id" and "-id"
const sort = Type.Transform(
   Type.Union(
      [Type.String(), Type.Object({ by: Type.String(), dir: StringEnum(["asc", "desc"]) })],
      {
         default: { by: "id", dir: "asc" }
      }
   )
)
   .Decode((value) => {
      if (typeof value === "string") {
         return JSON.parse(value);
      }
      return value;
   })
   .Encode(JSON.stringify);

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

export const querySchema = Type.Object(
   {
      limit: Type.Optional(limit),
      offset: Type.Optional(offset),
      sort: Type.Optional(sort),
      select: Type.Optional(stringArray),
      with: Type.Optional(stringArray),
      join: Type.Optional(stringArray),
      where: Type.Optional(whereSchema)
   },
   {
      additionalProperties: false
   }
);

export type RepoQueryIn = Simplify<Static<typeof querySchema>>;
export type RepoQuery = Required<StaticDecode<typeof querySchema>>;
export const defaultQuerySchema = Value.Default(querySchema, {}) as RepoQuery;
