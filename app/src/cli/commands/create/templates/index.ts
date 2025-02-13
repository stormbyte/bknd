import { cloudflare } from "./cloudflare";

export type TemplateSetupCtx = {
   template: Template;
   dir: string;
};

export type Integration = "node" | "bun" | "cloudflare" | "nextjs" | "remix" | "astro" | "custom";

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
   preinstall?: (ctx: TemplateSetupCtx) => Promise<void>;
   postinstall?: (ctx: TemplateSetupCtx) => Promise<void>;
   setup?: (ctx: TemplateSetupCtx) => Promise<void>;
};

export const templates = [
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
   cloudflare
] as const satisfies Template[];
