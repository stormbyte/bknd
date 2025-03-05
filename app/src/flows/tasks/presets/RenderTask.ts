import { Type } from "core/utils";
import { Task } from "../Task";

export class RenderTask<Output extends Record<string, any>> extends Task<
   typeof RenderTask.schema,
   Output
> {
   type = "render";

   static override schema = Type.Object({
      render: Type.String(),
   });

   async execute() {
      return this.params.render as unknown as Output;
   }
}
