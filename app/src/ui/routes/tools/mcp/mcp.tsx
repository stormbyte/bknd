import * as AppShell from "ui/layouts/AppShell/AppShell";
import { useMcpStore } from "./state";
import * as Tools from "./tools";
import { TbWorld } from "react-icons/tb";
import { McpIcon } from "./components/mcp-icon";
import { useBknd } from "ui/client/bknd";
import { Empty } from "ui/components/display/Empty";

export default function ToolsMcp() {
   const { config, options } = useBknd();
   const feature = useMcpStore((state) => state.feature);
   const setFeature = useMcpStore((state) => state.setFeature);

   if (!config.server.mcp.enabled) {
      return (
         <Empty
            title="MCP not enabled"
            description="Please enable MCP in the settings to continue."
         />
      );
   }

   return (
      <div className="flex flex-col flex-grow">
         <AppShell.SectionHeader>
            <div className="flex flex-row gap-4 items-center">
               <McpIcon />
               <AppShell.SectionHeaderTitle>MCP UI</AppShell.SectionHeaderTitle>
               <div className="flex flex-row gap-2 items-center bg-primary/5 rounded-full px-3 pr-3.5 py-2">
                  <TbWorld />
                  <span className="text-sm font-mono leading-none">
                     {window.location.origin + "/mcp"}
                  </span>
               </div>
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
      </div>
   );
}
