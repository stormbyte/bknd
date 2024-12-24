/**
 * These are package global defaults.
 */
import type { Generated } from "kysely";

export type PrimaryFieldType = number | Generated<number>;

// biome-ignore lint/suspicious/noEmptyInterface: <explanation>
export interface DB {}

export const config = {
   server: {
      default_port: 1337
   },
   data: {
      default_primary_field: "id"
   }
} as const;
