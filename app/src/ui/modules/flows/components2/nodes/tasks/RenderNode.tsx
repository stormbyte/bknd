import { IconWorld } from "@tabler/icons-react";
import { LiquidJsEditor } from "ui/components/code/LiquidJsEditor";
import { BaseNode } from "../BaseNode";

export function RenderNode(props) {
   return (
      <BaseNode {...props} onChangeName={console.log} Icon={IconWorld} className="w-[400px]">
         <form className="flex flex-col gap-3">
            <LiquidJsEditor value={props.params.render} onChange={console.log} />
         </form>
      </BaseNode>
   );
}
