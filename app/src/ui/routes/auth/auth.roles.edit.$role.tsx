import { notifications } from "@mantine/notifications";
import { useRef } from "react";
import { TbDots } from "react-icons/tb";
import { useBknd } from "ui/client";
import { useBkndAuth } from "ui/client/schema/auth/use-bknd-auth";
import { Button } from "ui/components/buttons/Button";
import { IconButton } from "ui/components/buttons/IconButton";
import { Dropdown } from "ui/components/overlay/Dropdown";
import * as AppShell from "ui/layouts/AppShell/AppShell";
import { Breadcrumbs2 } from "ui/layouts/AppShell/Breadcrumbs2";
import { routes, useNavigate } from "ui/lib/routes";
import { AuthRoleForm, type AuthRoleFormRef } from "ui/routes/auth/forms/role.form";

export function AuthRolesEdit(props) {
   useBknd({ withSecrets: true });
   return <AuthRolesEditInternal {...props} />;
}

function AuthRolesEditInternal({ params }) {
   const [navigate] = useNavigate();
   const { config, actions } = useBkndAuth();
   const roleName = params.role;
   const role = config.roles?.[roleName];
   const formRef = useRef<AuthRoleFormRef>(null);

   async function handleUpdate() {
      console.log("data", formRef.current?.isValid());
      if (!formRef.current?.isValid()) return;
      const data = formRef.current?.getData();
      const success = await actions.roles.patch(roleName, data);

      /*notifications.show({
         id: `role-${roleName}-update`,
         position: "top-right",
         title: success ? "Update success" : "Update failed",
         message: success ? "Role updated successfully" : "Failed to update role",
         color: !success ? "red" : undefined
      });*/
   }

   async function handleDelete() {
      if (await actions.roles.delete(roleName)) {
         navigate(routes.auth.roles.list());
      }
   }

   return (
      <>
         <AppShell.SectionHeader
            right={
               <>
                  <Dropdown
                     items={[
                        {
                           label: "Advanced Settings",
                           onClick: () =>
                              navigate(routes.settings.path(["auth", "roles", roleName]), {
                                 absolute: true
                              })
                        },
                        {
                           label: "Delete",
                           onClick: handleDelete,
                           destructive: true
                        }
                     ]}
                     position="bottom-end"
                  >
                     <IconButton Icon={TbDots} />
                  </Dropdown>
                  <Button variant="primary" onClick={handleUpdate}>
                     Update
                  </Button>
               </>
            }
            className="pl-3"
         >
            <Breadcrumbs2
               path={[
                  { label: "Roles & Permissions", href: routes.auth.roles.list() },
                  { label: roleName }
               ]}
            />
         </AppShell.SectionHeader>
         <AppShell.Scrollable>
            <AuthRoleForm ref={formRef} role={role} />
         </AppShell.Scrollable>
      </>
   );
}
