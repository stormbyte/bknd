import { createClient, type Client, type Config, type InStatement } from "@libsql/client";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { $console } from "core";
import { FilterNumericKeysPlugin } from "data/plugins/FilterNumericKeysPlugin";
import type { ConnQuery, ConnQueryResults } from "../Connection";
import { SqliteConnection } from "./SqliteConnection";

export const LIBSQL_PROTOCOLS = ["wss", "https", "libsql"] as const;
export type LibSqlCredentials = Config & {
   protocol?: (typeof LIBSQL_PROTOCOLS)[number];
};

export class LibsqlConnection extends SqliteConnection<Client> {
   override name = "libsql";
   protected override readonly supported = {
      batching: true,
      softscans: true,
   };

   constructor(client: Client);
   constructor(credentials: LibSqlCredentials);
   constructor(clientOrCredentials: Client | LibSqlCredentials) {
      let client: Client;
      if (clientOrCredentials && "url" in clientOrCredentials) {
         let { url, authToken, protocol } = clientOrCredentials;
         if (protocol && LIBSQL_PROTOCOLS.includes(protocol)) {
            $console.log("changing protocol to", protocol);
            const [, rest] = url.split("://");
            url = `${protocol}://${rest}`;
         }

         client = createClient({ url, authToken });
      } else {
         client = clientOrCredentials;
      }

      super({
         excludeTables: ["libsql_wasm_func_table"],
         dialect: LibsqlDialect,
         dialectArgs: [{ client }],
         additionalPlugins: [new FilterNumericKeysPlugin()],
      });

      this.client = client;
   }

   override async executeQueries<O extends ConnQuery[]>(...qbs: O): Promise<ConnQueryResults<O>> {
      const compiled = this.getCompiled(...qbs);
      const stms: InStatement[] = compiled.map((q) => {
         return {
            sql: q.sql,
            args: q.parameters as any[],
         };
      });

      return this.withTransformedRows(await this.client.batch(stms)) as any;
   }
}
