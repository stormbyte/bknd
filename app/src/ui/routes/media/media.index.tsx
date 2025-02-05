import { IconPhoto } from "@tabler/icons-react";
import { useBknd } from "ui/client/BkndProvider";
import { Empty } from "ui/components/display/Empty";
import { Media } from "ui/elements";
import { useBrowserTitle } from "ui/hooks/use-browser-title";
import * as AppShell from "ui/layouts/AppShell/AppShell";
import { useLocation } from "wouter";

export function MediaIndex() {
   const { app, config } = useBknd();
   const [, navigate] = useLocation();
   useBrowserTitle(["Media"]);

   if (!config.media.enabled) {
      return (
         <Empty
            Icon={IconPhoto}
            title="Media not enabled"
            description="Please enable media in the settings to continue."
            primary={{
               children: "Manage Settings",
               onClick: () => navigate("/settings")
            }}
         />
      );
   }

   return (
      <AppShell.Scrollable>
         <div className="flex flex-1 p-3">
            <Media.Dropzone />
         </div>
      </AppShell.Scrollable>
   );
}
