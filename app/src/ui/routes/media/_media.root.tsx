import { IconPhoto } from "@tabler/icons-react";
import { TbSettings } from "react-icons/tb";
import { Dropzone } from "ui/modules/media/components/dropzone/Dropzone";
import { mediaItemsToFileStates } from "ui/modules/media/helper";
import { useLocation } from "wouter";
import { useClient } from "../../client";
import { useBknd } from "../../client/BkndProvider";
import { IconButton } from "../../components/buttons/IconButton";
import { Empty } from "../../components/display/Empty";
import { Link } from "../../components/wouter/Link";
import { useBrowserTitle } from "../../hooks/use-browser-title";
import { useEvent } from "../../hooks/use-event";
import * as AppShell from "../../layouts/AppShell/AppShell";

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
   const client = useClient();
   const query = client.media().list({ limit: 50 });

   const getUploadInfo = useEvent((file) => {
      const api = client.media().api();
      return {
         url: api.getFileUploadUrl(file),
         headers: api.getUploadHeaders(),
         method: "POST"
      };
   });

   const handleDelete = useEvent(async (file) => {
      return await client.media().deleteFile(file);
   });

   const media = query.data?.data || [];
   const initialItems = mediaItemsToFileStates(media, { baseUrl: client.baseUrl });

   console.log("initialItems", initialItems);

   return (
      <AppShell.Scrollable>
         <div className="flex flex-1 p-3">
            <Dropzone
               key={query.isSuccess ? "loaded" : "initial"}
               getUploadInfo={getUploadInfo}
               handleDelete={handleDelete}
               autoUpload
               initialItems={initialItems}
            />
         </div>
      </AppShell.Scrollable>
   );
}
