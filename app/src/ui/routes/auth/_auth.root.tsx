import { IconFingerprint } from "@tabler/icons-react";
import { TbSettings } from "react-icons/tb";
import { useBkndAuth } from "ui/client/schema/auth/use-bknd-auth";
import { IconButton } from "ui/components/buttons/IconButton";
import { Empty } from "ui/components/display/Empty";
import { Icon } from "ui/components/display/Icon";
import { Link } from "ui/components/wouter/Link";
import { useBrowserTitle } from "ui/hooks/use-browser-title";
import * as AppShell from "ui/layouts/AppShell/AppShell";
import { routes } from "ui/lib/routes";

export function AuthRoot({ children }) {
   const { config, $auth } = useBkndAuth();

   return (
      <>
         <AppShell.Sidebar>
            <AppShell.SectionHeader
               right={
                  <Link href={$auth.routes.settings}>
                     <IconButton Icon={TbSettings} />
                  </Link>
               }
            >
               Auth
            </AppShell.SectionHeader>
            <AppShell.Scrollable initialOffset={96}>
               <div className="flex flex-col flex-grow p-3 gap-3">
                  <nav className="flex flex-col flex-1 gap-1">
                     <AppShell.SidebarLink as={Link} href={"/"}>
                        Overview
                     </AppShell.SidebarLink>
                     <AppShell.SidebarLink
                        as={Link}
                        href={$auth.routes.listUsers}
                        disabled={!config.enabled}
                        className="justify-between"
                     >
                        Users
                        {!config.enabled && <AuthWarning title="Auth is not enabled." />}
                     </AppShell.SidebarLink>
                     <AppShell.SidebarLink
                        as={Link}
                        href={routes.auth.roles.list()}
                        disabled={!config.enabled}
                        className="justify-between"
                     >
                        Roles & Permissions
                        {!config.enabled ? (
                           <AuthWarning title="Auth is not enabled." />
                        ) : $auth.roles.none ? (
                           <AuthWarning title="No roles defined." />
                        ) : !$auth.roles.has_admin ? (
                           <AuthWarning title="No admin role defined." />
                        ) : null}
                     </AppShell.SidebarLink>
                     <AppShell.SidebarLink
                        as={Link}
                        href={routes.auth.strategies()}
                        disabled={!config.enabled}
                        className="justify-between"
                     >
                        Strategies
                        {!config.enabled && <AuthWarning title="Auth is not enabled." />}
                     </AppShell.SidebarLink>
                     <AppShell.SidebarLink
                        as={Link}
                        href={routes.auth.settings()}
                        className="justify-between"
                     >
                        Settings
                     </AppShell.SidebarLink>
                  </nav>
               </div>
            </AppShell.Scrollable>
         </AppShell.Sidebar>
         <AppShell.Main>{children}</AppShell.Main>
      </>
   );
}

const AuthWarning = ({ title }) => (
   <Icon.Warning title={title} className="size-5 pointer-events-auto" />
);

export function AuthEmpty() {
   useBrowserTitle(["Auth"]);
   return <Empty Icon={IconFingerprint} title="Not implemented yet" />;
}
