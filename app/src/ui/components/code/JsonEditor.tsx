import { Suspense, lazy } from "react";
import { twMerge } from "tailwind-merge";
import type { CodeEditorProps } from "./CodeEditor";
const CodeEditor = lazy(() => import("./CodeEditor"));

export function JsonEditor({ editable, className, ...props }: CodeEditorProps) {
   return (
      <Suspense fallback={null}>
         <CodeEditor
            className={twMerge(
               "flex w-full border border-muted",
               !editable && "opacity-70",
               className
            )}
            editable={editable}
            _extensions={{ json: true }}
            {...props}
         />
      </Suspense>
   );
}
