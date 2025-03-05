import { IconHierarchy2 } from "@tabler/icons-react";
import { ReactFlowProvider } from "@xyflow/react";
import { ucFirstAllSnakeToPascalWithSpaces } from "core/utils";
import { TbSettings } from "react-icons/tb";
import { useLocation } from "wouter";
import { useBknd } from "../../client/BkndProvider";
import { useFlows } from "../../client/schema/flows/use-flows";
import { IconButton } from "../../components/buttons/IconButton";
import { Empty } from "../../components/display/Empty";
import { SearchInput } from "../../components/form/SearchInput";
import { Link } from "../../components/wouter/Link";
import { useBrowserTitle } from "../../hooks/use-browser-title";
import * as AppShell from "../../layouts/AppShell/AppShell";

export function FlowsRoot({ children }) {
   return <ReactFlowProvider>{children}</ReactFlowProvider>;
}

export function FlowsEmpty() {
   const { app } = useBknd();
   useBrowserTitle(["Flows"]);
   const [, navigate] = useLocation();
   const { flows } = useFlows();

   return (
      <>
         <AppShell.Sidebar>
            <AppShell.SectionHeader
               right={
                  <Link href={app.getSettingsPath(["flows"])}>
                     <IconButton Icon={TbSettings} />
                  </Link>
               }
            >
               Flows
            </AppShell.SectionHeader>
            <AppShell.Scrollable initialOffset={96}>
               <div className="flex flex-col flex-grow p-3 gap-3">
                  <div>
                     <SearchInput placeholder="Search flows" />
                  </div>
                  <nav className="flex flex-col flex-1 gap-1">
                     {flows.map((flow) => (
                        <AppShell.SidebarLink key={flow.name} as={Link} href={`/flow/${flow.name}`}>
                           {ucFirstAllSnakeToPascalWithSpaces(flow.name)}
                        </AppShell.SidebarLink>
                     ))}
                  </nav>
               </div>
            </AppShell.Scrollable>
         </AppShell.Sidebar>
         <main className="flex flex-col flex-grow">
            <Empty
               Icon={IconHierarchy2}
               title="No flow selected"
               description="Please select a flow from the left sidebar or create a new one
            to continue."
               primary={{
                  children: "Create Flow",
                  onClick: () => navigate(app.getSettingsPath(["flows"])),
               }}
            />
         </main>
      </>
   );
}
