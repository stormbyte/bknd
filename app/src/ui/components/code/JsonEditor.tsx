import { json } from "@codemirror/lang-json";
import type { ReactCodeMirrorProps } from "@uiw/react-codemirror";
import { Suspense, lazy } from "react";
import { twMerge } from "tailwind-merge";
const CodeEditor = lazy(() => import("./CodeEditor"));

export function JsonEditor({ editable, className, ...props }: ReactCodeMirrorProps) {
   return (
      <Suspense fallback={null}>
         <CodeEditor
            className={twMerge(
               "flex w-full border border-muted",
               !editable && "opacity-70",
               className
            )}
            editable={editable}
            extensions={[json()]}
            {...props}
         />
      </Suspense>
   );
}
