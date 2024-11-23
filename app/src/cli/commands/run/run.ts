import type { Config } from "@libsql/client/node";
import { App } from "App";
import type { BkndConfig } from "adapter";
import type { CliCommand } from "cli/types";
import { Option } from "commander";
import type { Connection } from "data";
import {
   PLATFORMS,
   type Platform,
   attachServeStatic,
   getConfigPath,
   getConnection,
   getHtml,
   startServer
} from "./platform";

const isBun = typeof Bun !== "undefined";

export const run: CliCommand = (program) => {
   program
      .command("run")
      .addOption(
         new Option("-p, --port <port>", "port to run on")
            .env("PORT")
            .default(1337)
            .argParser((v) => Number.parseInt(v))
      )
      .addOption(new Option("-c, --config <config>", "config file"))
      .addOption(
         new Option("--db-url <db>", "database url, can be any valid libsql url").conflicts(
            "config"
         )
      )
      .addOption(new Option("--db-token <db>", "database token").conflicts("config"))
      .addOption(
         new Option("--server <server>", "server type")
            .choices(PLATFORMS)
            .default(isBun ? "bun" : "node")
      )
      .action(action);
};

type MakeAppConfig = {
   connection: Connection;
   server?: { platform?: Platform };
   setAdminHtml?: boolean;
   onBuilt?: (app: App) => Promise<void>;
};

async function makeApp(config: MakeAppConfig) {
   const app = new App(config.connection);

   app.emgr.on(
      "app-built",
      async () => {
         await attachServeStatic(app, config.server?.platform ?? "node");
         app.registerAdminController({ html: await getHtml() });

         if (config.onBuilt) {
            await config.onBuilt(app);
         }
      },
      "sync"
   );

   await app.build();
   return app;
}

export async function makeConfigApp(config: BkndConfig, platform?: Platform) {
   const appConfig = typeof config.app === "function" ? config.app(process.env) : config.app;
   const app = App.create(appConfig);

   app.emgr.on(
      "app-built",
      async () => {
         await attachServeStatic(app, platform ?? "node");
         app.registerAdminController({ html: await getHtml() });

         if (config.onBuilt) {
            await config.onBuilt(app);
         }
      },
      "sync"
   );

   await app.build();
   return app;
}

async function action(options: {
   port: number;
   config?: string;
   dbUrl?: string;
   dbToken?: string;
   server: Platform;
}) {
   const configFilePath = await getConfigPath(options.config);

   let app: App;
   if (options.dbUrl || !configFilePath) {
      const connection = getConnection(
         options.dbUrl ? { url: options.dbUrl, authToken: options.dbToken } : undefined
      );
      app = await makeApp({ connection, server: { platform: options.server } });
   } else {
      console.log("Using config from:", configFilePath);
      const config = (await import(configFilePath).then((m) => m.default)) as BkndConfig;
      app = await makeConfigApp(config, options.server);
   }

   await startServer(options.server, app, { port: options.port });
}
