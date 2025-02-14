import { cloudflare } from "./cloudflare";

export type TemplateSetupCtx = {
   template: Template;
   dir: string;
   name: string;
};

export type Integration = "node" | "bun" | "cloudflare" | "nextjs" | "remix" | "astro" | "custom";

type TemplateScripts = "install" | "dev" | "build" | "start";
export type Template = {
   /**
    * unique key for the template
    */
   key: string;
   /**
    * the integration this template is for
    */
   integration: Integration;
   title: string;
   description?: string;
   path: string;
   /**
    * adds a ref "#{ref}" to the path. If "true", adds the current version of bknd
    */
   ref?: true | string;
   scripts?: Partial<Record<TemplateScripts, string>>;
   preinstall?: (ctx: TemplateSetupCtx) => Promise<void>;
   postinstall?: (ctx: TemplateSetupCtx) => Promise<void>;
   setup?: (ctx: TemplateSetupCtx) => Promise<void>;
};

export const templates: Template[] = [
   {
      key: "node",
      title: "Node.js Basic",
      integration: "node",
      description: "A basic bknd Node.js server",
      path: "gh:bknd-io/bknd/examples/node",
      ref: true
   },
   {
      key: "bun",
      title: "Bun Basic",
      integration: "bun",
      description: "A basic bknd Bun server",
      path: "gh:bknd-io/bknd/examples/bun",
      ref: true
   },
   cloudflare,
   {
      key: "remix",
      title: "Remix Basic",
      integration: "remix",
      description: "A basic bknd Remix starter",
      path: "gh:bknd-io/bknd/examples/remix",
      ref: true
   },
   {
      // @todo: add `concurrently`?
      key: "nextjs",
      title: "Next.js Basic",
      integration: "nextjs",
      description: "A basic bknd Next.js starter",
      path: "gh:bknd-io/bknd/examples/nextjs",
      scripts: {
         install: "npm install --force"
      },
      ref: true
   },
   {
      key: "astro",
      title: "Astro Basic",
      integration: "astro",
      description: "A basic bknd Astro starter",
      path: "gh:bknd-io/bknd/examples/astro",
      ref: true
   }
];
