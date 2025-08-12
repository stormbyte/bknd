import { getPath, s, Tool } from "bknd/utils";
import {
   McpSchemaHelper,
   mcpSchemaSymbol,
   type AppToolHandlerCtx,
   type McpSchema,
   type SchemaWithMcpOptions,
} from "./McpSchemaHelper";

export interface RecordToolSchemaOptions extends s.IRecordOptions, SchemaWithMcpOptions {}

const opts = Symbol.for("bknd-mcp-record-opts");

export class RecordToolSchema<
      AP extends s.Schema,
      O extends RecordToolSchemaOptions = RecordToolSchemaOptions,
   >
   extends s.RecordSchema<AP, O>
   implements McpSchema
{
   constructor(name: string, ap: AP, options?: RecordToolSchemaOptions, new_schema?: s.Schema) {
      const { mcp, ...rest } = options || {};
      super(ap, rest as any);

      this[mcpSchemaSymbol] = new McpSchemaHelper(this, name, mcp || {});
      this[opts] = {
         new_schema,
      };
   }

   get mcp(): McpSchemaHelper {
      return this[mcpSchemaSymbol];
   }

   private getNewSchema(fallback: s.Schema = this.additionalProperties) {
      return this[opts].new_schema ?? fallback;
   }

   private toolGet(node: s.Node<RecordToolSchema<AP, O>>) {
      return new Tool(
         [this.mcp.name, "get"].join("_"),
         {
            ...this.mcp.getToolOptions("get"),
            inputSchema: s.strictObject({
               key: s
                  .string({
                     description: "key to get",
                  })
                  .optional(),
               secrets: s
                  .boolean({
                     default: false,
                     description: "(optional) include secrets in the response config",
                  })
                  .optional(),
               schema: s
                  .boolean({
                     default: false,
                     description: "(optional) include the schema in the response",
                  })
                  .optional(),
            }),
         },
         async (params, ctx: AppToolHandlerCtx) => {
            const configs = ctx.context.app.toJSON(params.secrets);
            const config = getPath(configs, node.instancePath);
            const [module_name] = node.instancePath;

            // @todo: add schema to response
            const schema = params.schema ? this.getNewSchema().toJSON() : undefined;

            if (params.key) {
               if (!(params.key in config)) {
                  throw new Error(`Key "${params.key}" not found in config`);
               }
               const value = getPath(config, params.key);
               return ctx.json({
                  secrets: params.secrets ?? false,
                  module: module_name,
                  key: params.key,
                  value: value ?? null,
                  schema,
               });
            }

            return ctx.json({
               secrets: params.secrets ?? false,
               module: module_name,
               key: null,
               value: config ?? null,
               schema,
            });
         },
      );
   }

   private toolAdd(node: s.Node<RecordToolSchema<AP, O>>) {
      return new Tool(
         [this.mcp.name, "add"].join("_"),
         {
            ...this.mcp.getToolOptions("add"),
            inputSchema: s.strictObject({
               key: s.string({
                  description: "key to add",
               }),
               value: this.getNewSchema(),
            }),
         },
         async (params, ctx: AppToolHandlerCtx) => {
            const configs = ctx.context.app.toJSON();
            const config = getPath(configs, node.instancePath);
            const [module_name, ...rest] = node.instancePath;

            if (params.key in config) {
               throw new Error(`Key "${params.key}" already exists in config`);
            }

            await ctx.context.app
               .mutateConfig(module_name as any)
               .patch([...rest, params.key], params.value);

            return ctx.json({
               success: true,
               module: module_name,
               config: ctx.context.app.module[module_name as any].config,
            });
         },
      );
   }

   private toolUpdate(node: s.Node<RecordToolSchema<AP, O>>) {
      return new Tool(
         [this.mcp.name, "update"].join("_"),
         {
            ...this.mcp.getToolOptions("update"),
            inputSchema: s.strictObject({
               key: s.string({
                  description: "key to update",
               }),
               value: this.getNewSchema(s.object({})),
            }),
         },
         async (params, ctx: AppToolHandlerCtx) => {
            const configs = ctx.context.app.toJSON(params.secrets);
            const config = getPath(configs, node.instancePath);
            const [module_name, ...rest] = node.instancePath;

            if (!(params.key in config)) {
               throw new Error(`Key "${params.key}" not found in config`);
            }

            await ctx.context.app
               .mutateConfig(module_name as any)
               .patch([...rest, params.key], params.value);

            return ctx.json({
               success: true,
               module: module_name,
               config: ctx.context.app.module[module_name as any].config,
            });
         },
      );
   }

   private toolRemove(node: s.Node<RecordToolSchema<AP, O>>) {
      return new Tool(
         [this.mcp.name, "remove"].join("_"),
         {
            ...this.mcp.getToolOptions("get"),
            inputSchema: s.strictObject({
               key: s.string({
                  description: "key to remove",
               }),
            }),
         },
         async (params, ctx: AppToolHandlerCtx) => {
            const configs = ctx.context.app.toJSON();
            const config = getPath(configs, node.instancePath);
            const [module_name, ...rest] = node.instancePath;

            if (!(params.key in config)) {
               throw new Error(`Key "${params.key}" not found in config`);
            }

            await ctx.context.app
               .mutateConfig(module_name as any)
               .remove([...rest, params.key].join("."));

            return ctx.json({
               success: true,
               module: module_name,
               config: ctx.context.app.module[module_name as any].config,
            });
         },
      );
   }

   getTools(node: s.Node<RecordToolSchema<AP, O>>): Tool<any, any, any>[] {
      const { tools = [] } = this.mcp.options;

      return [
         this.toolGet(node),
         this.toolAdd(node),
         this.toolUpdate(node),
         this.toolRemove(node),
         ...tools,
      ].filter(Boolean) as Tool<any, any, any>[];
   }
}

export const $record = <const AP extends s.Schema, const O extends RecordToolSchemaOptions>(
   name: string,
   ap: AP,
   options?: s.StrictOptions<RecordToolSchemaOptions, O>,
   new_schema?: s.Schema,
): RecordToolSchema<AP, O> => new RecordToolSchema(name, ap, options, new_schema) as any;
