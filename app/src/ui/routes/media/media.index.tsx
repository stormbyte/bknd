import { Media } from "ui/elements";
import { useBrowserTitle } from "ui/hooks/use-browser-title";
import * as AppShell from "ui/layouts/AppShell/AppShell";

export function MediaIndex() {
   useBrowserTitle(["Media"]);

   return (
      <AppShell.Scrollable>
         <div className="flex flex-1 p-3">
            <Media.Dropzone />
         </div>
      </AppShell.Scrollable>
   );
}
