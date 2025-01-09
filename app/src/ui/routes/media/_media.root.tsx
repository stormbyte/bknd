import { IconPhoto } from "@tabler/icons-react";
import { TbSettings } from "react-icons/tb";
import { useBknd } from "ui/client/BkndProvider";
import { IconButton } from "ui/components/buttons/IconButton";
import { Empty } from "ui/components/display/Empty";
import { Link } from "ui/components/wouter/Link";
import { Media } from "ui/elements";
import { useBrowserTitle } from "ui/hooks/use-browser-title";
import * as AppShell from "ui/layouts/AppShell/AppShell";
import { useLocation } from "wouter";

export function MediaRoot({ children }) {
   const { app, config } = useBknd();
   const [, navigate] = useLocation();
   useBrowserTitle(["Media"]);

   if (!config.media.enabled) {
      return (
         <Empty
            Icon={IconPhoto}
            title="Media not enabled"
            description="Please enable media in the settings to continue."
            buttonText="Manage Settings"
            buttonOnClick={() => navigate(app.getSettingsPath(["media"]))}
         />
      );
   }

   return (
      <>
         <AppShell.Sidebar>
            <AppShell.SectionHeader
               right={
                  <Link href={app.getSettingsPath(["media"])}>
                     <IconButton Icon={TbSettings} />
                  </Link>
               }
            >
               Media
            </AppShell.SectionHeader>
            <AppShell.Scrollable initialOffset={96}>
               <div className="flex flex-col flex-grow p-3 gap-3">
                  {/*<div>
                     <SearchInput placeholder="Search buckets" />
                  </div>*/}
                  <nav className="flex flex-col flex-1 gap-1">
                     <AppShell.SidebarLink as={Link} href="/media" className="active">
                        Main Bucket
                     </AppShell.SidebarLink>
                  </nav>
               </div>
            </AppShell.Scrollable>
         </AppShell.Sidebar>
         <main className="flex flex-col flex-grow">{children}</main>
      </>
   );
}

// @todo: add infinite load
export function MediaEmpty() {
   useBrowserTitle(["Media"]);

   return (
      <AppShell.Scrollable>
         <div className="flex flex-1 p-3">
            <Media.Dropzone />
         </div>
      </AppShell.Scrollable>
   );
}
