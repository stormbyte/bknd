import { isDebug } from "../env";

export async function formatSql(sql: string): Promise<string> {
   if (isDebug()) {
      const { format } = await import("sql-formatter");
      return format(sql);
   }
   return "";
}
