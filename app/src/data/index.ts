import { MutatorEvents, RepositoryEvents } from "./events";

export * from "./fields";
export * from "./entities";
export * from "./relations";
export * from "./schema/SchemaManager";

export {
   type RepoQuery,
   defaultQuerySchema,
   querySchema,
   whereSchema
} from "./server/data-query-impl";

export { whereRepoSchema as deprecated__whereRepoSchema } from "./server/query";

export { Connection } from "./connection/Connection";
export { LibsqlConnection, type LibSqlCredentials } from "./connection/LibsqlConnection";
export { SqliteConnection } from "./connection/SqliteConnection";
export { SqliteLocalConnection } from "./connection/SqliteLocalConnection";

export const DatabaseEvents = {
   ...MutatorEvents,
   ...RepositoryEvents
};
export { MutatorEvents, RepositoryEvents };

export * as DataPermissions from "./permissions";
