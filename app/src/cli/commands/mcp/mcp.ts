import type { CliCommand } from "cli/types";
import { makeAppFromEnv } from "../run";
import { s, mcp as mcpMiddleware, McpServer, isObject, getMcpServer } from "bknd/utils";
import type { McpSchema } from "modules/mcp";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { mcpSchemaSymbol } from "modules/mcp/McpSchemaHelper";
import { getVersion } from "cli/utils/sys";

export const mcp: CliCommand = (program) =>
   program
      .command("mcp")
      .description("mcp server")
      .option("--port <port>", "port to listen on", "3000")
      .option("--path <path>", "path to listen on", "/mcp")
      .option(
         "--token <token>",
         "token to authenticate requests, if not provided, uses BEARER_TOKEN environment variable",
      )
      .option("--log-level <level>", "log level")
      .action(action);

async function action(options: {
   port?: string;
   path?: string;
   token?: string;
   logLevel?: string;
}) {
   const app = await makeAppFromEnv({
      server: "node",
   });

   const token = options.token || process.env.BEARER_TOKEN;
   const middlewareServer = getMcpServer(app.server);

   const appConfig = app.modules.configs();
   const { version, ...appSchema } = app.getSchema();

   const schema = s.strictObject(appSchema);

   const nodes = [...schema.walk({ data: appConfig })].filter(
      (n) => isObject(n.schema) && mcpSchemaSymbol in n.schema,
   ) as s.Node<McpSchema>[];
   const tools = [
      ...middlewareServer.tools,
      ...app.modules.ctx().mcp.tools,
      ...nodes.flatMap((n) => n.schema.getTools(n)),
   ];
   const resources = [...middlewareServer.resources, ...app.modules.ctx().mcp.resources];

   const server = new McpServer(
      {
         name: "bknd",
         version: await getVersion(),
      },
      { app, ctx: () => app.modules.ctx() },
      tools,
      resources,
   );

   if (token) {
      server.setAuthentication({
         type: "bearer",
         token,
      });
   }

   const hono = new Hono().use(
      mcpMiddleware({
         server,
         sessionsEnabled: true,
         debug: {
            logLevel: options.logLevel as any,
            explainEndpoint: true,
         },
         endpoint: {
            path: String(options.path) as any,
         },
      }),
   );

   serve({
      fetch: hono.fetch,
      port: Number(options.port) || 3000,
   });
   console.info(`Server is running on http://localhost:${options.port}${options.path}`);
   console.info(
      `⚙️  Tools (${server.tools.length}):\n${server.tools.map((t) => `- ${t.name}`).join("\n")}\n`,
   );
   console.info(
      `📚 Resources (${server.resources.length}):\n${server.resources.map((r) => `- ${r.name}`).join("\n")}`,
   );
}
