import type { Command } from "commander";

export type CliCommand = (program: Command) => void;
