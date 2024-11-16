import { liquid } from "@codemirror/lang-liquid";
import type { ReactCodeMirrorProps } from "@uiw/react-codemirror";
import { Suspense, lazy } from "react";
import { twMerge } from "tailwind-merge";
const CodeEditor = lazy(() => import("./CodeEditor"));

const filters = [
   { label: "abs" },
   { label: "append" },
   { label: "array_to_sentence_string" },
   { label: "at_least" },
   { label: "at_most" },
   { label: "capitalize" },
   { label: "ceil" },
   { label: "cgi_escape" },
   { label: "compact" },
   { label: "concat" },
   { label: "date" },
   { label: "date_to_long_string" },
   { label: "date_to_rfc822" },
   { label: "date_to_string" },
   { label: "date_to_xmlschema" },
   { label: "default" },
   { label: "divided_by" },
   { label: "downcase" },
   { label: "escape" },
   { label: "escape_once" },
   { label: "find" },
   { label: "find_exp" },
   { label: "first" },
   { label: "floor" },
   { label: "group_by" },
   { label: "group_by_exp" },
   { label: "inspect" },
   { label: "join" },
   { label: "json" },
   { label: "jsonify" },
   { label: "last" },
   { label: "lstrip" },
   { label: "map" },
   { label: "minus" },
   { label: "modulo" },
   { label: "newline_to_br" },
   { label: "normalize_whitespace" },
   { label: "number_of_words" },
   { label: "plus" },
   { label: "pop" },
   { label: "push" },
   { label: "prepend" },
   { label: "raw" },
   { label: "remove" },
   { label: "remove_first" },
   { label: "remove_last" },
   { label: "replace" },
   { label: "replace_first" },
   { label: "replace_last" },
   { label: "reverse" },
   { label: "round" },
   { label: "rstrip" },
   { label: "shift" },
   { label: "size" },
   { label: "slice" },
   { label: "slugify" },
   { label: "sort" },
   { label: "sort_natural" },
   { label: "split" },
   { label: "strip" },
   { label: "strip_html" },
   { label: "strip_newlines" },
   { label: "sum" },
   { label: "times" },
   { label: "to_integer" },
   { label: "truncate" },
   { label: "truncatewords" },
   { label: "uniq" },
   { label: "unshift" },
   { label: "upcase" },
   { label: "uri_escape" },
   { label: "url_decode" },
   { label: "url_encode" },
   { label: "where" },
   { label: "where_exp" },
   { label: "xml_escape" }
];

const tags = [
   { label: "assign" },
   { label: "capture" },
   { label: "case" },
   { label: "comment" },
   { label: "cycle" },
   { label: "decrement" },
   { label: "echo" },
   { label: "else" },
   { label: "elsif" },
   { label: "for" },
   { label: "if" },
   { label: "include" },
   { label: "increment" },
   { label: "layout" },
   { label: "liquid" },
   { label: "raw" },
   { label: "render" },
   { label: "tablerow" },
   { label: "unless" },
   { label: "when" }
];

export function LiquidJsEditor({ editable, ...props }: ReactCodeMirrorProps) {
   return (
      <Suspense fallback={null}>
         <CodeEditor
            className={twMerge(
               "flex w-full border border-muted bg-white rounded-lg",
               !editable && "opacity-70"
            )}
            editable={editable}
            extensions={[liquid({ filters, tags })]}
            {...props}
         />
      </Suspense>
   );
}
