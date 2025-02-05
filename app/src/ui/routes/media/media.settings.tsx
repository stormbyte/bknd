import { IconBrandAws, IconCloud, IconServer } from "@tabler/icons-react";
import { autoFormatString } from "core/utils";
import { twMerge } from "tailwind-merge";
import { useBknd } from "ui/client/BkndProvider";
import { useBkndMedia } from "ui/client/schema/media/use-bknd-media";
import { Button } from "ui/components/buttons/Button";
import { Message } from "ui/components/display/Message";
import * as Formy from "ui/components/form/Formy";
import {
   AnyOf,
   Field,
   Form,
   FormContextOverride,
   ObjectField,
   Subscribe
} from "ui/components/form/json-schema-form";
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

const ignore = ["entity_name", "basepath"];
function MediaSettingsInternal() {
   const { config, schema } = useBkndMedia();

   async function onSubmit(data: any) {
      console.log("submit", data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
   }

   return (
      <>
         <Form
            schema={schema}
            initialValues={config as any}
            ignoreKeys={ignore}
            onSubmit={onSubmit}
            noValidate
         >
            <Subscribe>
               {({ dirty, errors, submitting }) => (
                  <AppShell.SectionHeader
                     right={
                        <Button
                           variant="primary"
                           type="submit"
                           disabled={!dirty || errors.length > 0 || submitting}
                        >
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
                     <Overlay />
                     <Field name="storage.body_max_size" label="Storage Body Max Size" />
                  </div>
               </div>
               <AppShell.Separator />
               <div className="flex flex-col gap-3 p-3">
                  <Overlay />
                  <AnyOf.Root path="adapter">
                     <Adapters />
                  </AnyOf.Root>
               </div>
               {/*<Subscribe>
                  {({ data, errors }) => (
                     <JsonViewer json={JSON.parse(JSON.stringify({ data, errors }))} expand={999} />
                  )}
               </Subscribe>*/}
            </AppShell.Scrollable>
         </Form>
      </>
   );
}

const Icons = [IconBrandAws, IconCloud, IconServer];

const AdapterIcon = ({ index }: { index: number }) => {
   const Icon = Icons[index];
   if (!Icon) return null;
   return <Icon />;
};

function Adapters() {
   const ctx = AnyOf.useContext();

   return (
      <Formy.Group>
         <Formy.Label className="flex flex-row items-center gap-1">
            <span className="font-bold">Media Adapter:</span>
            {!ctx.selected && <span className="opacity-70"> (Choose one)</span>}
         </Formy.Label>
         <div className="flex flex-row gap-1 mb-2">
            {ctx.schemas?.map((schema: any, i) => (
               <Button
                  key={i}
                  onClick={() => ctx.select(i)}
                  variant={ctx.selected === i ? "primary" : "outline"}
                  className={twMerge(
                     "flex flex-row items-center justify-center gap-3 border",
                     ctx.selected === i && "border-primary"
                  )}
               >
                  <div>
                     <AdapterIcon index={i} />
                  </div>
                  <div className="flex flex-col items-start justify-center">
                     <span>{autoFormatString(schema.title)}</span>
                     {schema.description && (
                        <span className="text-xs opacity-70 text-left">{schema.description}</span>
                     )}
                  </div>
               </Button>
            ))}
         </div>
         {ctx.selected !== null && (
            <Formy.Group as="fieldset" error={ctx.errors.length > 0}>
               <Formy.Label as="legend" className="font-mono px-2">
                  {autoFormatString(ctx.selectedSchema!.title!)}
               </Formy.Label>
               <FormContextOverride schema={ctx.selectedSchema} path={ctx.path} overrideData>
                  <Field name="type" hidden />
                  <ObjectField path="config" wrapperProps={{ label: false, wrapper: "group" }} />
               </FormContextOverride>
            </Formy.Group>
         )}
      </Formy.Group>
   );
}

const Overlay = () => (
   <Subscribe>
      {({ data }) =>
         !data.enabled && (
            <div className="absolute w-full h-full z-50 bg-background opacity-70 pointer-events-none" />
         )
      }
   </Subscribe>
);
