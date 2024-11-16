import { getDefaultConfig } from "modules/ModuleManager";
import type { CliCommand } from "../types";

export const config: CliCommand = (program) => {
   program
      .command("config")
      .description("get default config")
      .option("--pretty", "pretty print")
      .action((options) => {
         console.log(getDefaultConfig(options.pretty));
      });
};
