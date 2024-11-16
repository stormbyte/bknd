import { useBknd, useClient } from "ui/client";
import { routes } from "ui/lib/routes";
import {
   Button,
   ButtonLink,
   type ButtonLinkProps,
   type ButtonProps
} from "../../components/buttons/Button";
import * as AppShell from "../../layouts/AppShell/AppShell";

export function AuthIndex() {
   const client = useClient();
   const { app, config } = useBknd();
   const users_entity = config.auth.entity_name;
   const query = client.query().data.entity("users").count();
   const usersTotal = query.data?.body.count ?? 0;
   const {
      config: {
         auth: { roles, strategies }
      }
   } = useBknd();
   const rolesTotal = Object.keys(roles ?? {}).length ?? 0;
   const strategiesTotal = Object.keys(strategies ?? {}).length ?? 0;

   const usersLink = app.getAbsolutePath("/data/" + routes.data.entity.list(users_entity));
   const rolesLink = routes.auth.roles.list();
   const strategiesLink = app.getSettingsPath(["auth", "strategies"]);

   return (
      <>
         <AppShell.SectionHeader>Overview</AppShell.SectionHeader>
         <AppShell.Scrollable>
            <div className="flex flex-col flex-grow p-3 gap-3">
               <div className="grid xs:grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                  <KpiCard
                     title="Users registered"
                     value={usersTotal}
                     actions={[
                        {
                           label: "View all",
                           href: usersLink
                        },
                        { label: "Add new", variant: "default", href: usersLink }
                     ]}
                  />
                  <KpiCard
                     title="Roles"
                     value={rolesTotal}
                     actions={[
                        { label: "View all", href: rolesLink },
                        { label: "Add new", variant: "default", href: rolesLink }
                     ]}
                  />
                  <KpiCard
                     title="Strategies enabled"
                     value={strategiesTotal}
                     actions={[
                        { label: "View all", href: strategiesLink },
                        { label: "Add new", variant: "default", href: strategiesLink }
                     ]}
                  />
               </div>
            </div>
         </AppShell.Scrollable>
      </>
   );
}

type KpiCardProps = {
   title: string;
   value: number;
   actions: (Omit<ButtonLinkProps, "href"> & { label: string; href?: string })[];
};

const KpiCard: React.FC<KpiCardProps> = ({ title, value, actions }) => (
   <div className="flex flex-col border border-muted">
      <div className="flex flex-col gap-2 px-5 pt-3.5 pb-4 border-b border-b-muted">
         <div>
            <span className="opacity-50">{title}</span>
            {/*<span>+6.1%</span>*/}
         </div>
         <div className="text-4xl font-medium">{value}</div>
      </div>
      <div className="flex flex-row gap-3 p-3 justify-between">
         {actions.map((action, i) => (
            <ButtonLink key={i} size="small" variant="ghost" href="#" {...action}>
               {action.label}
            </ButtonLink>
         ))}
      </div>
   </div>
);
