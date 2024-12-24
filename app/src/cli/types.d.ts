import type { CreateAppConfig } from "App";
import type { FrameworkBkndConfig } from "adapter";
import type { Command } from "commander";

export type CliCommand = (program: Command) => void;

export type CliBkndConfig<Env = any> = FrameworkBkndConfig & {
   app: CreateAppConfig | ((env: Env) => CreateAppConfig);
   setAdminHtml?: boolean;
   server?: {
      port?: number;
      platform?: "node" | "bun";
   };
};
