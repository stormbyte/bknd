import * as AppShell from "ui/layouts/AppShell/AppShell";
import { useMcpStore } from "./state";
import * as Tools from "./tools";

export default function MCPTest() {
   const feature = useMcpStore((state) => state.feature);
   const setFeature = useMcpStore((state) => state.setFeature);

   return (
      <>
         <AppShell.SectionHeader>
            <div className="flex flex-row gap-4 items-center">
               <AppShell.SectionHeaderTitle>MCP UI</AppShell.SectionHeaderTitle>
            </div>
         </AppShell.SectionHeader>
         <div className="flex h-full">
            <AppShell.Sidebar>
               <Tools.Sidebar open={feature === "tools"} toggle={() => setFeature("tools")} />
               <AppShell.SectionHeaderAccordionItem
                  title="Resources"
                  open={feature === "resources"}
                  toggle={() => setFeature("resources")}
               >
                  <div className="flex flex-col flex-grow p-3 gap-3 justify-center items-center opacity-40">
                     <i>Resources</i>
                  </div>
               </AppShell.SectionHeaderAccordionItem>
            </AppShell.Sidebar>
            {feature === "tools" && <Tools.Content />}
         </div>
      </>
   );
}
