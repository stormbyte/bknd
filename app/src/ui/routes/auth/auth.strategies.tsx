import { cloneDeep, omit } from "lodash-es";
import { useBknd } from "ui/client";
import { Button } from "ui/components/buttons/Button";
import { JsonSchemaForm } from "ui/components/form/json-schema/JsonSchemaForm";
import * as AppShell from "../../layouts/AppShell/AppShell";
import { extractSchema } from "../settings/utils/schema";

export function AuthStrategiesList() {
   useBknd({ withSecrets: true });
   return <AuthStrategiesListInternal />;
}

const uiSchema = {
   jwt: {
      fields: {
         "ui:options": {
            orderable: false
         }
      }
   }
};

function AuthStrategiesListInternal() {
   const s = useBknd();
   const config = s.config.auth.strategies;
   const schema = cloneDeep(omit(s.schema.auth.properties.strategies, ["title"]));

   console.log("strategies", { config, schema });

   return (
      <>
         <AppShell.SectionHeader right={<Button variant="primary">Update</Button>}>
            Strategies
         </AppShell.SectionHeader>
         <AppShell.Scrollable>
            strat
            {/*<div className="flex flex-col flex-grow px-5 py-4 gap-8">
               <div>
                  <JsonSchemaForm
                     schema={generalSchema}
                     className="legacy hide-required-mark fieldset-alternative mute-root"
                  />
               </div>

               <div className="flex flex-col gap-3">
                  <h3 className="font-bold">JWT Settings</h3>
                  <JsonSchemaForm
                     schema={extracted.jwt.schema}
                     uiSchema={uiSchema.jwt}
                     className="legacy hide-required-mark fieldset-alternative mute-root"
                  />
               </div>
            </div>*/}
         </AppShell.Scrollable>
      </>
   );
}
