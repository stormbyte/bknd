import { modals } from "@mantine/modals";
import { IconSettings } from "@tabler/icons-react";
import { ucFirst } from "core/utils";
import { Route, Switch } from "wouter";
import { useBknd } from "../../client";
import { Empty } from "../../components/display/Empty";
import { Link } from "../../components/wouter/Link";
import { useBrowserTitle } from "../../hooks/use-browser-title";
import * as AppShell from "../../layouts/AppShell/AppShell";
import { bkndModals } from "../../modals";
import { Setting } from "./components/Setting";
import { AuthSettings } from "./routes/auth.settings";
import { DataSettings } from "./routes/data.settings";
import { FlowsSettings } from "./routes/flows.settings";

function SettingsSidebar() {
   const { version, schema } = useBknd();
   useBrowserTitle(["Settings"]);

   const modules = Object.keys(schema).map((key) => {
      return {
         title: schema[key].title ?? ucFirst(key),
         key
      };
   });

   return (
      <AppShell.Sidebar>
         <AppShell.SectionHeader right={<span className="font-mono">v{version}</span>}>
            Settings
         </AppShell.SectionHeader>
         <AppShell.Scrollable initialOffset={96}>
            <div className="flex flex-col flex-grow p-3 gap-3">
               <nav className="flex flex-col flex-1 gap-1">
                  {modules.map((module, key) => (
                     <AppShell.SidebarLink as={Link} key={key} href={`/${module.key}`}>
                        {module.title}
                     </AppShell.SidebarLink>
                  ))}
               </nav>
            </div>
            {/*<button
               onClick={() =>
                  modals.openContextModal({
                     modal: "test",
                     title: "Test Modal",
                     innerProps: { modalBody: "This is a test modal" }
                  })
               }
            >
               modal
            </button>
            <button
               onClick={() =>
                  bkndModals.open(bkndModals.ids.test, { modalBody: "test" }, { title: "what" })
               }
            >
               modal2
            </button>
            <button onClick={() => bkndModals.open("test", { modalBody: "test" })}>modal</button>
            <button
               onClick={() =>
                  bkndModals.open("debug", {
                     data: {
                        one: { what: 1 }
                     }
                  })
               }
            >
               debug
            </button>*/}
         </AppShell.Scrollable>
      </AppShell.Sidebar>
   );
}

export default function SettingsRoutes() {
   useBknd({ withSecrets: true });
   return (
      <>
         <SettingsSidebar />
         <AppShell.Main>
            <Switch>
               <Route
                  path="/"
                  component={() => (
                     <Empty
                        Icon={IconSettings}
                        title="No Setting selected"
                        description="Please select a setting from the left sidebar."
                     />
                  )}
               />

               <SettingRoutesRoutes />

               <Route
                  path="*"
                  component={() => (
                     <Empty
                        Icon={IconSettings}
                        title="Settings not found"
                        description="Check other options."
                     />
                  )}
               />
            </Switch>
         </AppShell.Main>
      </>
   );
}

const uiSchema = {
   server: {
      cors: {
         allow_methods: {
            "ui:widget": "checkboxes"
         },
         allow_headers: {
            "ui:options": {
               orderable: false
            }
         }
      }
   },
   media: {
      adapter: {
         "ui:options": {
            label: false
         }
         /*type: {
            "ui:widget": "hidden"
         }*/
      }
   }
};

const SettingRoutesRoutes = () => {
   const { schema, config } = useBknd();

   console.log("flows", {
      schema: schema.flows,
      config: config.flows
   });

   return (
      <>
         <FallbackRoutes
            module="server"
            schema={schema}
            config={config}
            uiSchema={uiSchema.server}
         />
         <DataSettings schema={schema.data} config={config.data} />
         <AuthSettings schema={schema.auth} config={config.auth} />
         <FallbackRoutes module="media" schema={schema} config={config} uiSchema={uiSchema.media} />
         <FlowsSettings schema={schema.flows} config={config.flows} />
      </>
   );
};

const FallbackRoutes = ({ module, schema, config, ...settingProps }) => {
   const { app } = useBknd();
   const basepath = app.getAdminConfig();
   const prefix = `~/${basepath}/settings`.replace(/\/+/g, "/");

   return (
      <Route path={`/${module}`} nest>
         <Switch>
            <Route
               path="/"
               component={() => (
                  <Setting
                     {...settingProps}
                     schema={schema[module]}
                     config={config[module]}
                     prefix={`${prefix}/${module}`}
                     path={[module]}
                  />
               )}
               nest
            />
         </Switch>
      </Route>
   );
};
