import { Suspense, lazy, useRef } from "react";
import {
   CreateModal,
   type CreateModalRef
} from "ui/modules/data/components/schema/create-modal/CreateModal";
import { Button } from "../../components/buttons/Button";
import * as AppShell from "../../layouts/AppShell/AppShell";

const DataSchemaCanvas = lazy(() =>
   import("ui/modules/data/components/canvas/DataSchemaCanvas").then((m) => ({
      default: m.DataSchemaCanvas
   }))
);

export function DataSchemaIndex() {
   const createModalRef = useRef<CreateModalRef>(null);

   return (
      <>
         <CreateModal ref={createModalRef} />
         <AppShell.SectionHeader
            right={
               <Button
                  type="button"
                  variant="primary"
                  onClick={() => createModalRef.current?.open()}
               >
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
