import { default as CodeMirror, type ReactCodeMirrorProps } from "@uiw/react-codemirror";

import { useBknd } from "ui/client/bknd";

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
      <CodeMirror
         theme={theme === "dark" ? "dark" : "light"}
         editable={editable}
         basicSetup={_basicSetup}
         {...props}
      />
   );
}
