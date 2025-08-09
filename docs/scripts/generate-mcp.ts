import type { Tool, Resource } from "jsonv-ts/mcp";
import { rimraf } from "rimraf";

const config = {
   mcpConfig: "./mcp.json",
   outFile: "./content/docs/(documentation)/modules/server/mcp.mdx",
};

async function generate() {
   console.info("Generating MCP documentation...");
   await cleanup();
   const mcpConfig = await Bun.file(config.mcpConfig).json();
   const document = await generateDocument(mcpConfig);
   await Bun.write(config.outFile, document);
   console.info("MCP documentation generated.");
}

async function generateDocument({
   tools,
   resources,
}: {
   tools: ReturnType<Tool["toJSON"]>[];
   resources: ReturnType<Resource["toJSON"]>[];
}) {
   return `---
title: "MCP"
description: "Built-in full featured MCP server."
tags: ["documentation"]
---
import { JsonSchemaTypeTable } from '@/components/McpTool';

## Tools

${tools
   .map(
      (t) => `
### ${t.name}

${t.description ?? ""}

<JsonSchemaTypeTable schema={${JSON.stringify(t.inputSchema)}} key={"${String(t.name)}"} />`,
   )
   .join("\n")}
   

## Resources

${resources
   .map(
      (r) => `

### ${r.name}

${r.description ?? ""}
`,
   )
   .join("\n")}
`;
}

async function cleanup() {
   await rimraf(config.outFile);
}

void generate();
