import path from "node:path";
import url from "node:url";
import { getDistPath, getRelativeDistPath, getRootPath } from "cli/utils/sys";
import type { CliCommand } from "../types";

export const debug: CliCommand = (program) => {
   program
      .command("debug")
      .description("debug path resolution")
      .action(() => {
         console.log("paths", {
            rootpath: getRootPath(),
            distPath: getDistPath(),
            relativeDistPath: getRelativeDistPath(),
            cwd: process.cwd(),
            dir: path.dirname(url.fileURLToPath(import.meta.url)),
            resolvedPkg: path.resolve(getRootPath(), "package.json")
         });
      });
};
