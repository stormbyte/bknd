import { cloneDeep } from "lodash-es";
import { useBknd } from "ui/client/bknd";
import { Setting } from "ui/routes/settings/components/Setting";
import { Route } from "wouter";

const uiSchema = {
   cors: {
      allow_methods: {
         "ui:widget": "checkboxes",
      },
      allow_headers: {
         "ui:options": {
            orderable: false,
         },
      },
   },
};

export const ServerSettings = ({ schema: _unsafe_copy, config }) => {
   const { app } = useBknd();
   const _schema = cloneDeep(_unsafe_copy);
   const prefix = app.getAbsolutePath("settings");

   const schema = _schema;

   return (
      <Route path="/server" nest>
         <Route
            path="/"
            component={() => (
               <Setting
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
