import { McpClient, type McpClientConfig } from "jsonv-ts/mcp";
import { Draft2019 } from "json-schema-library";

const clients = new Map<string, McpClient>();

export function getClient(
   { url, ...opts }: McpClientConfig = { url: window.location.origin + "/mcp" },
) {
   if (!clients.has(String(url))) {
      clients.set(String(url), new McpClient({ url, ...opts }));
   }
   return clients.get(String(url))!;
}

export function getTemplate(schema: object) {
   if (!schema || schema === undefined || schema === null) return undefined;

   const lib = new Draft2019(schema);
   return lib.getTemplate(undefined, schema);
}
