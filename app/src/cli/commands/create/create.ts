import fs from "node:fs";
import { downloadTemplate } from "@bluwy/giget-core";
import * as $p from "@clack/prompts";
import type { CliCommand } from "cli/types";
import { typewriter, wait } from "cli/utils/cli";
import { exec, getVersion } from "cli/utils/sys";
import { Option } from "commander";
import color from "picocolors";
import { updateBkndPackages } from "./npm";
import { type Template, templates } from "./templates";

const config = {
   types: {
      runtime: "Runtime",
      framework: "Framework"
   },
   runtime: {
      node: "Node.js",
      bun: "Bun",
      cloudflare: "Cloudflare"
   },
   framework: {
      nextjs: "Next.js",
      remix: "Remix",
      astro: "Astro"
   }
} as const;

export const create: CliCommand = (program) => {
   program
      .command("create")
      .addOption(new Option("-i, --integration <integration>", "integration to use"))
      .addOption(new Option("-t, --template <template>", "template to use"))
      .addOption(new Option("-d --dir <directory>", "directory to create in"))
      .description("create a new project")
      .action(action);
};

async function action(options: { template?: string; dir?: string; integration?: string }) {
   const _config = {
      defaultDir: process.env.LOCAL ? "./.template" : "./",
      speed: {
         typewriter: process.env.LOCAL ? 0 : 20,
         wait: process.env.LOCAL ? 0 : 250
      }
   };
   const downloadOpts = {
      dir: options.dir || _config.defaultDir,
      clean: false
   };

   const version = await getVersion();
   $p.intro(
      `👋 Welcome to the ${color.bold(color.cyan("bknd"))} create wizard ${color.bold(`v${version}`)}`
   );

   await $p.stream.message(
      (async function* () {
         yield* typewriter(
            "Thanks for choosing to create a new project with bknd!",
            _config.speed.typewriter,
            color.dim
         );
         await wait(_config.speed.wait);
      })()
   );

   if (!options.dir) {
      const dir = await $p.text({
         message: "Where to create your project?",
         placeholder: downloadOpts.dir,
         initialValue: downloadOpts.dir
      });
      if ($p.isCancel(dir)) {
         process.exit(1);
      }

      downloadOpts.dir = dir || "./";
   }

   if (fs.existsSync(downloadOpts.dir)) {
      const clean = await $p.confirm({
         message: `Directory ${color.cyan(downloadOpts.dir)} exists. Clean it?`,
         initialValue: false
      });
      if ($p.isCancel(clean)) {
         process.exit(1);
      }

      downloadOpts.clean = clean;
   }

   let template: Template | undefined;
   if (options.template) {
      template = templates.find((t) => t.key === options.template) as Template;
      if (!template) {
         $p.log.error(`Template ${color.cyan(options.template)} not found`);
         process.exit(1);
      }
   } else {
      let integration: string | undefined = options.integration;
      if (!integration) {
         await $p.stream.info(
            (async function* () {
               yield* typewriter("Ready? ", _config.speed.typewriter * 1.5, color.bold);
               await wait(500);
               yield* typewriter(
                  "Let's find the perfect template for you.",
                  _config.speed.typewriter,
                  color.dim
               );
               await wait(500);
            })()
         );

         const type = await $p.select({
            message: "Pick an integration type",
            options: Object.entries(config.types).map(([value, name]) => ({
               value,
               label: name,
               hint: Object.values(config[value]).join(", ")
            }))
         });

         if ($p.isCancel(type)) {
            process.exit(1);
         }

         const _integration = await $p.select({
            message: `Which ${color.cyan(config.types[type])} do you want to continue with?`,
            options: Object.entries(config[type]).map(([value, name]) => ({
               value,
               label: name
            })) as any
         });
         if ($p.isCancel(_integration)) {
            process.exit(1);
         }
         integration = String(_integration);
      }
      if (!integration) {
         $p.log.error("No integration selected");
         process.exit(1);
      }

      //console.log("integration", { type, integration });

      const choices = templates.filter((t) => t.integration === integration);
      if (choices.length === 0) {
         $p.log.error(`No templates found for "${color.cyan(String(integration))}"`);
         process.exit(1);
      } else if (choices.length > 1) {
         const selected_template = await $p.select({
            message: "Pick a template",
            options: choices.map((t) => ({ value: t.key, label: t.title, hint: t.description }))
         });

         if ($p.isCancel(selected_template)) {
            process.exit(1);
         }

         template = choices.find((t) => t.key === selected_template) as Template;
      } else {
         template = choices[0];
      }
   }
   if (!template) {
      $p.log.error("No template selected");
      process.exit(1);
   }

   const ctx = { template, dir: downloadOpts.dir };

   {
      const prefix =
         template.ref === true
            ? `#v${version}`
            : typeof template.ref === "string"
              ? `#${template.ref}`
              : "";
      const url = `${template.path}${prefix}`;

      console.log("url", url);
      const s = $p.spinner();
      s.start("Downloading template...");
      const result = await downloadTemplate(url, {
         dir: ctx.dir,
         force: downloadOpts.clean ? "clean" : true
      });
      console.log("result", result);

      s.stop("Template downloaded.");
      await updateBkndPackages({ dir: ctx.dir });

      if (template.preinstall) {
         await template.preinstall(ctx);
      }
   }

   {
      const install = await $p.confirm({
         message: "Install dependencies?"
      });

      if ($p.isCancel(install)) {
         process.exit(1);
      } else if (install) {
         const s = $p.spinner();
         s.start("Installing dependencies...");
         exec(`cd ${ctx.dir} && npm install`, { silent: true });
         s.stop("Dependencies installed.");

         if (template!.postinstall) {
            await template.postinstall(ctx);
         }
      } else {
         await $p.stream.warn(
            (async function* () {
               yield* typewriter("Remember to run ", _config.speed.typewriter, color.dim);
               await wait(_config.speed.typewriter);
               yield* typewriter("npm install", _config.speed.typewriter, color.cyan);
               await wait(_config.speed.typewriter);
               yield* typewriter(" after setup", _config.speed.typewriter, color.dim);
               await wait(_config.speed.wait / 2);
            })()
         );
      }
   }

   if (template.setup) {
      await template.setup(ctx);
   }

   await $p.stream.success(
      (async function* () {
         yield* typewriter("That's it! ", _config.speed.typewriter);
         await wait(_config.speed.wait / 2);
         yield "🎉";
         await wait(_config.speed.wait);
         yield "\n\n";
         yield* typewriter(
            `Enter your project's directory using ${color.cyan("cd " + ctx.dir)}
If you need help, check ${color.cyan("https://docs.bknd.io")} or join our Discord!`,
            _config.speed.typewriter
         );
         await wait(_config.speed.wait * 2);
      })()
   );

   $p.outro(color.green("Setup complete."));
}
