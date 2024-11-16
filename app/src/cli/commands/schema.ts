import { getDefaultSchema } from "modules/ModuleManager";
import type { CliCommand } from "../types";

export const schema: CliCommand = (program) => {
   program
      .command("schema")
      .description("get schema")
      .option("--pretty", "pretty print")
      .action((options) => {
         console.log(getDefaultSchema(options.pretty));
      });
};
