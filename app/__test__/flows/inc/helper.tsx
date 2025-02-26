import { Task } from "../../../src/flows";

// @todo: polyfill
const Handle = (props: any) => null;
type NodeProps<T> = any;
const Position = { Top: "top", Bottom: "bottom" };

class ExecTask extends Task {
   type = "exec";

   constructor(
      name: string,
      params: any,
      private fn: () => any,
   ) {
      super(name, params);
   }

   override clone(name: string, params: any) {
      return new ExecTask(name, params, this.fn);
   }

   async execute() {
      //console.log("executing", this.name);
      return await this.fn();
   }
}

/*const ExecNode = ({
   data,
   isConnectable,
   targetPosition = Position.Top,
   sourcePosition = Position.Bottom,
   selected,
}: NodeProps<ExecTask>) => {
   //console.log("data", data, data.hasDelay());
   return (
      <>
         <Handle type="target" position={targetPosition} isConnectable={isConnectable} />
         {data?.name} ({selected ? "selected" : "exec"})
         <Handle type="source" position={sourcePosition} isConnectable={isConnectable} />
      </>
   );
};*/

export function getNamedTask(name: string, _func?: () => Promise<any>, delay?: number) {
   const func =
      _func ??
      (async () => {
         //console.log(`[DONE] Task: ${name}`);
         return true;
      });

   return new ExecTask(
      name,
      {
         delay,
      },
      func,
   );
}
