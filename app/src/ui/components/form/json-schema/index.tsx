import { Suspense, forwardRef, lazy } from "react";
import type { JsonSchemaFormProps, JsonSchemaFormRef } from "./JsonSchemaForm";

export type { JsonSchemaFormProps, JsonSchemaFormRef };

const Module = lazy(() =>
   import("./JsonSchemaForm").then((m) => ({
      default: m.JsonSchemaForm
   }))
);

export const JsonSchemaForm = forwardRef<JsonSchemaFormRef, JsonSchemaFormProps>((props, ref) => {
   return (
      <Suspense>
         <Module ref={ref} {...props} />
      </Suspense>
   );
});
