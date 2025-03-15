import { Kysely, ParseJSONResultsPlugin } from "kysely";
import { SqliteConnection, SqliteIntrospector } from "bknd/data";
import { SQLocalKysely } from "sqlocal/kysely";
import type { ClientConfig } from "sqlocal";

const plugins = [new ParseJSONResultsPlugin()];

export type SQLocalConnectionConfig = Omit<ClientConfig, "databasePath"> & {
   // make it optional
   databasePath?: ClientConfig["databasePath"];
};

export class SQLocalConnection extends SqliteConnection {
   private _client: SQLocalKysely | undefined;

   constructor(private config: SQLocalConnectionConfig) {
      super(null as any, {}, plugins);
   }

   override async init() {
      if (this.initialized) return;

      await new Promise((resolve) => {
         this._client = new SQLocalKysely({
            ...this.config,
            databasePath: this.config.databasePath ?? "session",
            onConnect: (r) => {
               this.kysely = new Kysely<any>({
                  dialect: {
                     ...this._client!.dialect,
                     createIntrospector: (db: Kysely<any>) => {
                        return new SqliteIntrospector(db, {
                           plugins,
                        });
                     },
                  },
                  plugins,
               });
               this.config.onConnect?.(r);
               resolve(1);
            },
         });
      });
      super.init();
   }

   get client(): SQLocalKysely {
      if (!this._client) throw new Error("Client not initialized");
      return this._client!;
   }
}
