import { Suspense, lazy } from "react";
import { useBkndData } from "ui/client/schema/data/use-bknd-data";
import { Button } from "ui/components/buttons/Button";
import * as AppShell from "ui/layouts/AppShell/AppShell";

const DataSchemaCanvas = lazy(() =>
   import("ui/modules/data/components/canvas/DataSchemaCanvas").then((m) => ({
      default: m.DataSchemaCanvas
   }))
);

export function DataSchemaIndex() {
   const { $data } = useBkndData();
   return (
      <>
         <AppShell.SectionHeader
            right={
               <Button type="button" variant="primary" onClick={$data.modals.createAny}>
                  Create new
               </Button>
            }
         >
            Schema Overview
         </AppShell.SectionHeader>
         <div className="w-full h-full">
            <Suspense>
               <DataSchemaCanvas />
            </Suspense>
         </div>
      </>
   );
}
