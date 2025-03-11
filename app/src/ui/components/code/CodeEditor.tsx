import { default as CodeMirror, type ReactCodeMirrorProps } from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { type LiquidCompletionConfig, liquid } from "@codemirror/lang-liquid";
import { useTheme } from "ui/client/use-theme";

export type CodeEditorProps = ReactCodeMirrorProps & {
   _extensions?: Partial<{
      json: boolean;
      liquid: LiquidCompletionConfig;
   }>;
};

export default function CodeEditor({
   editable,
   basicSetup,
   _extensions = {},
   ...props
}: CodeEditorProps) {
   const { theme } = useTheme();
   const _basicSetup: Partial<ReactCodeMirrorProps["basicSetup"]> = !editable
      ? {
           ...(typeof basicSetup === "object" ? basicSetup : {}),
           highlightActiveLine: false,
           highlightActiveLineGutter: false,
        }
      : basicSetup;

   const extensions = Object.entries(_extensions ?? {})
      .map(([ext, config]: any) => {
         switch (ext) {
            case "json":
               return json();
            case "liquid":
               return liquid(config);
         }
         return undefined;
      })
      .filter(Boolean) as any;

   return (
      <CodeMirror
         theme={theme === "dark" ? "dark" : "light"}
         editable={editable}
         basicSetup={_basicSetup}
         extensions={extensions}
         {...props}
      />
   );
}
