import { cloneDeep } from "lodash-es";
import { useBknd } from "ui";
import { Setting } from "ui/routes/settings/components/Setting";
import { Route } from "wouter";

const uiSchema = {
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
};

export const ServerSettings = ({ schema: _unsafe_copy, config }) => {
   const { app, adminOverride } = useBknd();
   const { basepath } = app.getAdminConfig();
   const _schema = cloneDeep(_unsafe_copy);
   const prefix = `~/${basepath}/settings`.replace(/\/+/g, "/");

   const schema = _schema;
   if (adminOverride) {
      schema.properties.admin.readOnly = true;
   }

   return (
      <Route path="/server" nest>
         <Route
            path="/"
            component={() => (
               <Setting
                  options={{
                     showAlert: () => {
                        if (adminOverride) {
                           return "The admin settings are read-only as they are overriden. Remaining server configuration can be edited.";
                        }
                        return;
                     }
                  }}
                  schema={schema}
                  uiSchema={uiSchema}
                  config={config}
                  prefix={`${prefix}/server`}
                  path={["server"]}
               />
            )}
            nest
         />
      </Route>
   );
};
