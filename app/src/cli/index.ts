#!/usr/bin/env node

import { Command } from "commander";
import * as commands from "./commands";
import { getVersion } from "./utils/sys";
const program = new Command();

export async function main() {
   program
      .name("bknd")
      .description("bknd cli")
      .version(await getVersion());

   // register commands
   for (const command of Object.values(commands)) {
      command(program);
   }

   program.parse();
}

main().then(null).catch(console.error);
