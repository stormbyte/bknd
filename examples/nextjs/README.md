# bknd starter: Next.js
A minimal Next.js project with bknd integration.

## Project Structure

Inside of your Next.js project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── admin/
│       │   └── [[...admin]].tsx
│       └── api/
│       │   └── [...route].ts
│       ├── _app.tsx
│       ├── _document.tsx
│       └── index.tsx
└── package.json
```

To update `bknd` config, check `src/pages/api/[...route].ts` and `src/pages/admin/[[...admin]].tsx`.

## Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
|:--------------------------|:-------------------------------------------------|
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:3000`      |
| `npm run build`           | Build your production site                       |
| `npm run db`              | Starts a local LibSQL database                   |

## Want to learn more?

Feel free to check [our documentation](https://docs.bknd.io/integration/nextjs) or jump into our [Discord server](https://discord.gg/952SFk8Tb8).
