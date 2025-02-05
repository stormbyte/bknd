import { Form, useFormContext } from "json-schema-form-react";
import { omit } from "lodash-es";
import { useState } from "react";
import { useBknd } from "ui/client/BkndProvider";
import { useBkndMedia } from "ui/client/schema/media/use-bknd-media";
import { Button } from "ui/components/buttons/Button";
import { JsonViewer } from "ui/components/code/JsonViewer";
import { Message } from "ui/components/display/Message";
import * as Formy from "ui/components/form/Formy";
import { BooleanInputMantine } from "ui/components/form/Formy/BooleanInputMantine";
import { JsonSchemaForm } from "ui/components/form/json-schema";
import { TypeboxValidator } from "ui/components/form/json-schema-form";
import { AutoForm, Field } from "ui/components/form/json-schema-form/components/Field";
import { Media } from "ui/elements";
import { useBrowserTitle } from "ui/hooks/use-browser-title";
import * as AppShell from "ui/layouts/AppShell/AppShell";

const validator = new TypeboxValidator();

export function MediaSettings(props) {
   useBrowserTitle(["Media", "Settings"]);

   const { hasSecrets } = useBknd({ withSecrets: true });
   if (!hasSecrets) {
      return <Message.MissingPermission what="Media Settings" />;
   }

   return <MediaSettingsInternal {...props} />;
}

function MediaSettingsInternal() {
   const { config, schema } = useBkndMedia();
   const [data, setData] = useState<any>(config);
   //console.log("schema", schema);

   return (
      <>
         <Form
            schema={schema}
            validator={validator}
            onChange={setData}
            defaultValues={config as any}
         >
            {({ errors, submitting, dirty }) => (
               <>
                  <AppShell.SectionHeader
                     right={
                        <Button variant="primary" disabled={!dirty || submitting}>
                           Update
                        </Button>
                     }
                  >
                     Settings
                  </AppShell.SectionHeader>
                  <AppShell.Scrollable>
                     <div className="flex flex-col gap-3 p-3">
                        <Field name="enabled" />
                        <div className="flex flex-col gap-3 relative">
                           <Overlay visible={!data.enabled} />
                           <Field name="entity_name" />
                           <Field name="storage.body_max_size" title="Storage Body Max Size" />
                        </div>
                     </div>
                     <div className="flex flex-col gap-3 p-3 mt-3 border-t border-muted">
                        <Overlay visible={!data.enabled} />
                        <Adapters />
                     </div>
                     <JsonViewer json={data} expand={999} />
                  </AppShell.Scrollable>
               </>
            )}
         </Form>
      </>
   );
}

function Adapters() {
   const { config, schema } = useBkndMedia();
   const ctx = useFormContext();
   const current = config.adapter;
   const schemas = schema.properties.adapter.anyOf;
   const types = schemas.map((s) => s.properties.type.const) as string[];
   const currentType = current?.type ?? (types[0] as string);
   const [selected, setSelected] = useState<string>(currentType);
   const $schema = schemas.find((s) => s.properties.type.const === selected);
   console.log("$schema", $schema);

   function onChangeSelect(e) {
      setSelected(e.target.value);

      // wait quickly for the form to update before triggering a change
      setTimeout(() => {
         ctx.setValue("adapter.type", e.target.value);
      }, 10);
   }

   return (
      <div>
         <Formy.Select value={selected} onChange={onChangeSelect}>
            {types.map((type) => (
               <option key={type} value={type}>
                  {type}
               </option>
            ))}
         </Formy.Select>
         <div>current: {selected}</div>
         <div>options: {schemas.map((s) => s.title).join(", ")}</div>
         <Field name="adapter.type" defaultValue={selected} hidden />
         {$schema && <AutoForm schema={$schema?.properties.config} prefix="adapter.config" />}
         <hr />
         {/*{$schema && (
            <div data-ignore>
               <JsonSchemaForm
                  schema={omit($schema?.properties.config, "title")}
                  className="legacy hide-required-mark fieldset-alternative mute-root"
               />
            </div>
         )}*/}
      </div>
   );
}

const Overlay = ({ visible = false }) =>
   visible && (
      <div className="absolute w-full h-full z-50 bg-background opacity-70 pointer-events-none" />
   );
