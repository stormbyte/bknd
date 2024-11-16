import { z } from "zod";

const date = z.union([z.date(), z.string()]);
const numeric = z.union([z.number(), date]);
const boolean = z.union([z.boolean(), z.literal(1), z.literal(0)]);
const value = z.union([z.string(), boolean, numeric]);

const expressionCond = z.union([
   z.object({ $eq: value }).strict(),
   z.object({ $ne: value }).strict(),
   z.object({ $isnull: boolean }).strict(),
   z.object({ $notnull: boolean }).strict(),
   z.object({ $in: z.array(value) }).strict(),
   z.object({ $notin: z.array(value) }).strict(),
   z.object({ $gt: numeric }).strict(),
   z.object({ $gte: numeric }).strict(),
   z.object({ $lt: numeric }).strict(),
   z.object({ $lte: numeric }).strict(),
   z.object({ $between: z.array(numeric).min(2).max(2) }).strict()
] as const);

// prettier-ignore
const nonOperandString = z
   .string()
   .regex(/^(?!\$).*/)
   .min(1);

// {name: 'Michael'}
const literalCond = z.record(nonOperandString, value);

// { status: { $eq: 1 } }
const literalExpressionCond = z.record(nonOperandString, value.or(expressionCond));

const operandCond = z
   .object({
      $and: z.array(literalCond.or(expressionCond).or(literalExpressionCond)).optional(),
      $or: z.array(literalCond.or(expressionCond).or(literalExpressionCond)).optional()
   })
   .strict();

const literalSchema = literalCond.or(literalExpressionCond);
export type LiteralSchemaIn = z.input<typeof literalSchema>;
export type LiteralSchema = z.output<typeof literalSchema>;

export const filterSchema = literalSchema.or(operandCond);
export type FilterSchemaIn = z.input<typeof filterSchema>;
export type FilterSchema = z.output<typeof filterSchema>;

const stringArray = z
   .union([
      z.string().transform((v) => {
         if (v.includes(",")) return v.split(",");
         return v;
      }),
      z.array(z.string())
   ])
   .default([])
   .transform((v) => (Array.isArray(v) ? v : [v]));

export const whereRepoSchema = z
   .preprocess((v: unknown) => {
      try {
         return JSON.parse(v as string);
      } catch {
         return v;
      }
   }, filterSchema)
   .default({});

const repoQuerySchema = z.object({
   limit: z.coerce.number().default(10),
   offset: z.coerce.number().default(0),
   sort: z
      .preprocess(
         (v: unknown) => {
            try {
               return JSON.parse(v as string);
            } catch {
               return v;
            }
         },
         z.union([
            z.string().transform((v) => {
               if (v.includes(":")) {
                  let [field, dir] = v.split(":") as [string, string];
                  if (!["asc", "desc"].includes(dir)) dir = "asc";
                  return { by: field, dir } as { by: string; dir: "asc" | "desc" };
               } else {
                  return { by: v, dir: "asc" } as { by: string; dir: "asc" | "desc" };
               }
            }),
            z.object({
               by: z.string(),
               dir: z.enum(["asc", "desc"])
            })
         ])
      )
      .default({ by: "id", dir: "asc" }),
   select: stringArray,
   with: stringArray,
   join: stringArray,
   debug: z
      .preprocess((v) => {
         if (["0", "false"].includes(String(v))) return false;
         return Boolean(v);
      }, z.boolean())
      .default(false), //z.coerce.boolean().catch(false),
   where: whereRepoSchema
});

type RepoQueryIn = z.input<typeof repoQuerySchema>;
type RepoQuery = z.output<typeof repoQuerySchema>;
