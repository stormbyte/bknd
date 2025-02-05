import {
   AnyOf,
   Field,
   Form,
   FormContextOverride,
   ObjectField,
   Subscribe
} from "ui/components/form/json-schema-form";

import { useState } from "react";
import { useBknd } from "ui/client/BkndProvider";
import { useBkndMedia } from "ui/client/schema/media/use-bknd-media";
import { Button } from "ui/components/buttons/Button";
import { JsonViewer } from "ui/components/code/JsonViewer";
import { Message } from "ui/components/display/Message";
import * as Formy from "ui/components/form/Formy";

import type { ValueError } from "@sinclair/typebox/value";
import { type TSchema, Value } from "core/utils";
import { Media } from "ui/elements";
import { useBrowserTitle } from "ui/hooks/use-browser-title";
import * as AppShell from "ui/layouts/AppShell/AppShell";

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
   console.log("data", data);

   return (
      <>
         <Form schema={schema} onChange={setData} initialValues={config as any}>
            <Subscribe>
               {({ dirty }) => (
                  <AppShell.SectionHeader
                     right={
                        <Button variant="primary" disabled={!dirty /* || submitting*/}>
                           Update
                        </Button>
                     }
                  >
                     Settings
                  </AppShell.SectionHeader>
               )}
            </Subscribe>
            <AppShell.Scrollable>
               <div className="flex flex-col gap-3 p-3">
                  <Field name="enabled" />
                  <div className="flex flex-col gap-3 relative">
                     <Overlay visible={!data.enabled} />
                     <Field name="entity_name" />
                     <Field name="storage.body_max_size" label="Storage Body Max Size" />
                  </div>
               </div>
               <div className="flex flex-col gap-3 p-3 mt-3 border-t border-muted">
                  <Overlay visible={!data.enabled} />
                  <AnyOf.Root path="adapter">
                     <Adapters />
                  </AnyOf.Root>
               </div>
               <JsonViewer json={JSON.parse(JSON.stringify(data))} expand={999} />
            </AppShell.Scrollable>
         </Form>
      </>
   );
}

function Adapters() {
   const ctx = AnyOf.useContext();

   return (
      <>
         <div className="flex flex-row gap-1">
            {ctx.schemas?.map((schema: any, i) => (
               <Button
                  key={i}
                  onClick={() => ctx.select(i)}
                  variant={ctx.selected === i ? "primary" : "default"}
               >
                  {schema.title ?? `Option ${i + 1}`}
               </Button>
            ))}
         </div>

         {ctx.selected !== null && (
            <FormContextOverride schema={ctx.selectedSchema} path={ctx.path} overrideData>
               <Field name="type" hidden />
               <ObjectField path="config" wrapperProps={{ label: false, wrapper: "group" }} />
            </FormContextOverride>
         )}
      </>
   );
}

const Overlay = ({ visible = false }) =>
   visible && (
      <div className="absolute w-full h-full z-50 bg-background opacity-70 pointer-events-none" />
   );
