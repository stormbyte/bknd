import { TextInput } from "@mantine/core";
import { LiquidJsEditor } from "../../../components/code/LiquidJsEditor";
import * as Formy from "../../../components/form/Formy";

export function LiquidJsTest() {
   return (
      <div className="flex flex-col p-4 gap-3">
         <h1>LiquidJsTest</h1>
         <LiquidJsEditor />

         <TextInput />
         <Formy.Input />
      </div>
   );
}
