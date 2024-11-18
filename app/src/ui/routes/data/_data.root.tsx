import { SegmentedControl } from "@mantine/core";
import { IconDatabase } from "@tabler/icons-react";
import type { Entity, TEntityType } from "data";
import { twMerge } from "tailwind-merge";
import { useBknd } from "../../client";
import { Empty } from "../../components/display/Empty";
import { Link } from "../../components/wouter/Link";
import { useBrowserTitle } from "../../hooks/use-browser-title";
import * as AppShell from "../../layouts/AppShell/AppShell";
import { routes, useNavigate } from "../../lib/routes";

export function DataRoot({ children }) {
   // @todo: settings routes should be centralized
   const {
      app: { entities }
   } = useBknd();
   const entityList: Record<TEntityType, Entity[]> = {
      regular: [],
      generated: [],
      system: []
   } as const;
   const [navigate] = useNavigate();
   const context = window.location.href.match(/\/schema/) ? "schema" : "data";

   for (const entity of entities) {
      entityList[entity.getType()].push(entity);
   }

   function handleSegmentChange(value?: string) {
      if (!value) return;
      const selected = window.location.href.match(/\/entity\/([^/]+)/)?.[1] || null;
      switch (value) {
         case "data":
            if (selected) {
               navigate(routes.data.entity.list(selected));
            } else {
               navigate(routes.data.root(), { absolute: true });
            }
            break;
         case "schema":
            if (selected) {
               navigate(routes.data.schema.entity(selected));
            } else {
               navigate(routes.data.schema.root());
            }
            break;
      }
   }

   return (
      <>
         <AppShell.Sidebar>
            <AppShell.SectionHeader
               right={
                  <SegmentedControl
                     data={[
                        { value: "data", label: "Data" },
                        { value: "schema", label: "Schema" }
                     ]}
                     value={context}
                     onChange={handleSegmentChange}
                  />
               }
            >
               Entities
            </AppShell.SectionHeader>
            <AppShell.Scrollable initialOffset={96}>
               <div className="flex flex-col flex-grow py-3 gap-3">
                  {/*<div className="pt-3 px-3">
                     <SearchInput placeholder="Search entities" />
                  </div>*/}

                  <EntityLinkList entities={entityList.regular} context={context} />
                  <EntityLinkList entities={entityList.system} context={context} title="System" />
                  <EntityLinkList
                     entities={entityList.generated}
                     context={context}
                     title="Generated"
                  />
               </div>
            </AppShell.Scrollable>
         </AppShell.Sidebar>
         <AppShell.Main>{children}</AppShell.Main>
      </>
   );
}

const EntityLinkList = ({
   entities,
   title,
   context
}: { entities: Entity[]; title?: string; context: "data" | "schema" }) => {
   if (entities.length === 0) return null;

   return (
      <nav
         className={twMerge(
            "flex flex-col flex-1 gap-1 px-3",
            title && "border-t border-primary/10 pt-2"
         )}
      >
         {title && <div className="text-sm text-primary/50 ml-3.5 mb-1">{title}</div>}

         {entities.map((entity) => {
            const href =
               context === "data"
                  ? routes.data.entity.list(entity.name)
                  : routes.data.schema.entity(entity.name);
            return (
               <AppShell.SidebarLink key={entity.name} as={Link} href={href}>
                  {entity.label}
               </AppShell.SidebarLink>
            );
         })}
      </nav>
   );
};

export function DataEmpty() {
   useBrowserTitle(["Data"]);
   const [navigate] = useNavigate();

   function handleButtonClick() {
      //navigate(routes.settings.path(["data", "entities"]), { absolute: true });
      navigate(routes.data.schema.root());
   }

   return (
      <Empty
         Icon={IconDatabase}
         title="No entity selected"
         description="Please select an entity from the left sidebar or create a new one to continue."
         buttonText="Go to schema"
         buttonOnClick={handleButtonClick}
      />
   );
}
