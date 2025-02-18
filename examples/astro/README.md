# bknd starter: Astro
A minimal Astro project with bknd integration.

## Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── admin/
│       │   └── [...admin].astro
│       └── api/
│       │   └── [...api].astro
│       ├── index.astro
│       └── ssr.astro
└── package.json
```

To update `bknd` config, check `src/api/[...api].astro` and `src/admin/[...admin].astro`.

## Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## Want to learn more?

Feel free to check [our documentation](https://docs.bknd.io/integration/astro) or jump into our [Discord server](https://discord.gg/952SFk8Tb8).
