import type { ReactCodeMirrorProps } from "@uiw/react-codemirror";
import { Suspense, lazy } from "react";
import { useBknd } from "ui/client/bknd";
const CodeMirror = lazy(() => import("@uiw/react-codemirror"));

export default function CodeEditor({ editable, basicSetup, ...props }: ReactCodeMirrorProps) {
   const b = useBknd();
   const theme = b.app.getAdminConfig().color_scheme;
   const _basicSetup: Partial<ReactCodeMirrorProps["basicSetup"]> = !editable
      ? {
           ...(typeof basicSetup === "object" ? basicSetup : {}),
           highlightActiveLine: false,
           highlightActiveLineGutter: false
        }
      : basicSetup;

   return (
      <Suspense>
         <CodeMirror
            theme={theme === "dark" ? "dark" : "light"}
            editable={editable}
            basicSetup={_basicSetup}
            {...props}
         />
      </Suspense>
   );
}
