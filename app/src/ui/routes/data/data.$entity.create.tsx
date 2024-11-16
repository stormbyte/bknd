import { Type } from "core/utils";
import { useState } from "react";
import { EntityForm } from "ui/modules/data/components/EntityForm";
import { useEntityForm } from "ui/modules/data/hooks/useEntityForm";
import { useBknd } from "../../client/BkndProvider";
import { Button } from "../../components/buttons/Button";
import { type EntityData, useEntity } from "../../container";
import { useBrowserTitle } from "../../hooks/use-browser-title";
import { useSearch } from "../../hooks/use-search";
import * as AppShell from "../../layouts/AppShell/AppShell";
import { Breadcrumbs2 } from "../../layouts/AppShell/Breadcrumbs2";
import { routes } from "../../lib/routes";

export function DataEntityCreate({ params }) {
   const { app } = useBknd();
   const entity = app.entity(params.entity as string)!;
   const [error, setError] = useState<string | null>(null);
   useBrowserTitle(["Data", entity.label, "Create"]);

   const container = useEntity(entity.name);
   // @todo: use entity schema for prefilling
   const search = useSearch(Type.Object({}), {});
   console.log("search", search.value);

   function goBack(state?: Record<string, any>) {
      window.history.go(-1);
   }

   async function onSubmitted(changeSet?: EntityData) {
      console.log("create:changeSet", changeSet);
      //return;
      const res = await container.actions.create(changeSet);
      console.log("create:res", res);
      if (res.data?.error) {
         setError(res.data.error);
      } else {
         error && setError(null);
         // @todo: navigate to created?
         goBack();
      }
   }

   const { Form, handleSubmit, values } = useEntityForm({
      action: "create",
      entity,
      initialData: search.value,
      onSubmitted
   });

   const fieldsDisabled =
      container.raw.fetch?.isLoading ||
      container.status.fetch.isUpdating ||
      Form.state.isSubmitting;

   return (
      <>
         <AppShell.SectionHeader
            right={
               <>
                  <Button onClick={goBack}>Cancel</Button>
                  <Form.Subscribe
                     selector={(state) => [state.canSubmit, state.isSubmitting]}
                     children={([canSubmit, isSubmitting]) => (
                        <Button
                           type="button"
                           onClick={Form.handleSubmit}
                           variant="primary"
                           tabIndex={entity.fields.length}
                           disabled={!canSubmit || isSubmitting}
                        >
                           Create
                        </Button>
                     )}
                  />
               </>
            }
         >
            <Breadcrumbs2
               path={[
                  { label: entity.label, href: routes.data.entity.list(entity.name) },
                  { label: "Create" }
               ]}
            />
         </AppShell.SectionHeader>
         <AppShell.Scrollable key={entity.name}>
            {error && (
               <div className="flex flex-row dark:bg-red-950 bg-red-100 p-4">
                  <b className="mr-2">Create failed: </b> {error}
               </div>
            )}
            <EntityForm
               entity={entity}
               handleSubmit={handleSubmit}
               fieldsDisabled={fieldsDisabled}
               data={search.value}
               Form={Form}
               action="create"
               className="flex flex-grow flex-col gap-3 p-3"
            />
         </AppShell.Scrollable>
      </>
   );
}
