import { Permission } from "core";

export const admin = new Permission("system.admin");
export const api = new Permission("system.api");
export const configRead = new Permission("system.config.read");
export const configReadSecrets = new Permission("system.config.read.secrets");
export const configWrite = new Permission("system.config.write");
export const schemaRead = new Permission("system.schema.read");
export const build = new Permission("system.build");
