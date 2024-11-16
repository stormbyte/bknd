/**
 * These are package global defaults.
 */
import type { Generated } from "kysely";

export type PrimaryFieldType = number | Generated<number>;

export const config = {
   data: {
      default_primary_field: "id"
   }
} as const;
