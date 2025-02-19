#!/usr/bin/env node

import { Command } from "commander";
import color from "picocolors";
import * as commands from "./commands";
import { getVersion } from "./utils/sys";
const program = new Command();

export async function main() {
   const version = await getVersion();
   program
      .name("bknd")
      .description(color.yellowBright("⚡") + " bknd cli " + color.bold(color.cyan(`v${version}`)))
      .version(version);

   // register commands
   for (const command of Object.values(commands)) {
      command(program);
   }

   program.parse();
}

main().then(null).catch(console.error);
