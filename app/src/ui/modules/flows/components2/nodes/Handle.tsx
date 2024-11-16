import { type HandleProps, Position, Handle as XYFlowHandle } from "@xyflow/react";

export function Handle(props: Omit<HandleProps, "position">) {
   const base = {
      top: 16,
      width: 10,
      height: 10,
      background: "transparent",
      border: "2px solid #999"
   };
   const offset = -10;
   const styles = {
      target: {
         ...base,
         left: offset
      },
      source: {
         ...base,
         right: offset
      }
   };
   //console.log("type", props.type, styles[props.type]);

   return (
      <XYFlowHandle
         {...props}
         position={props.type === "source" ? Position.Right : Position.Left}
         style={styles[props.type]}
      />
   );
}
