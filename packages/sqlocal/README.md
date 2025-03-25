# SQLocal adapter for `bknd` (experimental)
This packages adds an adapter to use a SQLocal database with `bknd`](https://github.com/bknd-io/bknd). It is based on [`sqlocal`](https://github.com/DallasHoff/sqlocal) and the driver included for [`kysely`](https://github.com/kysely-org/kysely).

## Installation
Install the adapter with:
```bash
npm install @bknd/sqlocal
```

## Usage
Create a connection:

```ts
import { SQLocalConnection } from "@bknd/sqlocal";

const connection = new SQLocalConnection({
   databasePath: "db.sqlite"
});
```

Use the connection depending on which framework or runtime you are using. E.g., when using `createApp`, you can use the connection as follows:

```ts
import { createApp } from "bknd";
import { SQLocalConnection } from "@bknd/sqlocal";

const connection = new SQLocalConnection();
const app = createApp({ connection });
```