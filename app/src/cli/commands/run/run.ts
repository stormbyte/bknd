import type { Config } from "@libsql/client/node";
import { App, type CreateAppConfig } from "App";
import { StorageLocalAdapter } from "adapter/node";
import type { CliBkndConfig, CliCommand } from "cli/types";
import { Option } from "commander";
import { config } from "core";
import { registries } from "modules/registries";
import {
   PLATFORMS,
   type Platform,
   attachServeStatic,
   getConfigPath,
   startServer
} from "./platform";

const isBun = typeof Bun !== "undefined";

export const run: CliCommand = (program) => {
   program
      .command("run")
      .addOption(
         new Option("-p, --port <port>", "port to run on")
            .env("PORT")
            .default(config.server.default_port)
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

// automatically register local adapter
const local = StorageLocalAdapter.prototype.getName();
if (!registries.media.has(local)) {
   registries.media.register(local, StorageLocalAdapter);
}

type MakeAppConfig = {
   connection?: CreateAppConfig["connection"];
   server?: { platform?: Platform };
   setAdminHtml?: boolean;
   onBuilt?: (app: App) => Promise<void>;
};

async function makeApp(config: MakeAppConfig) {
   const app = App.create({ connection: config.connection });

   app.emgr.onEvent(
      App.Events.AppBuiltEvent,
      async () => {
         await attachServeStatic(app, config.server?.platform ?? "node");
         app.registerAdminController();

         if (config.onBuilt) {
            await config.onBuilt(app);
         }
      },
      "sync"
   );

   await app.build();
   return app;
}

export async function makeConfigApp(config: CliBkndConfig, platform?: Platform) {
   const appConfig = typeof config.app === "function" ? config.app(process.env) : config.app;
   const app = App.create(appConfig);

   app.emgr.onEvent(
      App.Events.AppBuiltEvent,
      async () => {
         await attachServeStatic(app, platform ?? "node");
         app.registerAdminController();

         await config.onBuilt?.(app);
      },
      "sync"
   );

   await config.beforeBuild?.(app);
   await app.build(config.buildConfig);
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
      const connection = options.dbUrl
         ? { type: "libsql" as const, config: { url: options.dbUrl, authToken: options.dbToken } }
         : undefined;
      app = await makeApp({ connection, server: { platform: options.server } });
   } else {
      console.log("Using config from:", configFilePath);
      const config = (await import(configFilePath).then((m) => m.default)) as CliBkndConfig;
      app = await makeConfigApp(config, options.server);
   }

   await startServer(options.server, app, { port: options.port });
}
