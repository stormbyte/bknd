# Postgres adapter for `bknd` (experimental)
This packages adds an adapter to use a Postgres database with [`bknd`](https://github.com/bknd-io/bknd). It is based on [`pg`](https://github.com/brianc/node-postgres) and the driver included in [`kysely`](https://github.com/kysely-org/kysely).

## Installation
Install the adapter with:
```bash
npm install @bknd/postgres
```

## Usage
Create a connection:

```ts
import { PostgresConnection } from "@bknd/postgres";

const connection = new PostgresConnection({
   host: "localhost",
   port: 5432,
   user: "postgres",
   password: "postgres",
   database: "bknd",
});
```

Use the connection depending on which framework or runtime you are using. E.g., when using `createApp`, you can use the connection as follows:

```ts
import { createApp } from "bknd";
import { PostgresConnection } from "@bknd/postgres";

const connection = new PostgresConnection();
const app = createApp({ connection });
```

Or if you're using it with a framework, say Next.js, you can add the connection object to where you're initializating the app:

```ts
// e.g. in src/app/api/[[...bknd]]/route.ts
import { serve } from "bknd/adapter/nextjs";
import { PostgresConnection } from "@bknd/postgres";

const connection = new PostgresConnection();
const handler = serve({
   connection
})

// ...
```

For more information about how to integrate Next.js in general, check out the [Next.js documentation](https://docs.bknd.io/integration/nextjs).