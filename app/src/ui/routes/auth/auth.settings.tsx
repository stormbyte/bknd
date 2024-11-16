import { cloneDeep, omit } from "lodash-es";
import { useBknd } from "ui/client";
import { Button } from "ui/components/buttons/Button";
import { JsonSchemaForm } from "ui/components/form/json-schema/JsonSchemaForm";
import * as AppShell from "ui/layouts/AppShell/AppShell";
import { extractSchema } from "../settings/utils/schema";

export function AuthSettingsList() {
   useBknd({ withSecrets: true });
   return <AuthSettingsListInternal />;
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

function AuthSettingsListInternal() {
   const s = useBknd();
   const config = s.config.auth;
   const schema = cloneDeep(omit(s.schema.auth, ["title"]));
   const [generalSchema, generalConfig, extracted] = extractSchema(schema as any, config, [
      "jwt",
      "roles",
      "guard",
      "strategies"
   ]);
   try {
      const user_entity = config.entity_name ?? "users";
      const entities = s.config.data.entities ?? {};
      const user_fields = Object.entries(entities[user_entity]?.fields ?? {})
         .map(([name, field]) => (!field.config?.virtual ? name : undefined))
         .filter(Boolean);

      if (user_fields) {
         console.log("user_fields", user_fields);
         extracted.jwt.schema.properties.fields.items.enum = user_fields;
         extracted.jwt.schema.properties.fields.uniqueItems = true;
         uiSchema.jwt.fields["ui:widget"] = "checkboxes";
      }
   } catch (e) {
      console.error(e);
   }
   console.log({ generalSchema, generalConfig, extracted });

   return (
      <>
         <AppShell.SectionHeader right={<Button variant="primary">Update</Button>}>
            Settings
         </AppShell.SectionHeader>
         <AppShell.Scrollable>
            <div className="flex flex-col flex-grow px-5 py-4 gap-8">
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
            </div>
         </AppShell.Scrollable>
      </>
   );
}

function AuthJwtSettings() {}
