import { useCallback, useEffect, useRef, useState } from "react";
import { getClient, getTemplate } from "./utils";
import { useMcpStore } from "./state";
import { AppShell } from "ui/layouts/AppShell";
import { TbRefresh } from "react-icons/tb";
import { IconButton } from "ui/components/buttons/IconButton";
import { JsonViewer, JsonViewerTabs, type JsonViewerTabsRef } from "ui/components/code/JsonViewer";
import { twMerge } from "ui/elements/mocks/tailwind-merge";
import { Form } from "ui/components/form/json-schema-form";
import { Button } from "ui/components/buttons/Button";
import * as Formy from "ui/components/form/Formy";

export function Sidebar({ open, toggle }) {
   const client = getClient();
   const tools = useMcpStore((state) => state.tools);
   const setTools = useMcpStore((state) => state.setTools);
   const setContent = useMcpStore((state) => state.setContent);
   const content = useMcpStore((state) => state.content);
   const [loading, setLoading] = useState(false);
   const [query, setQuery] = useState<string>("");

   const handleRefresh = useCallback(async () => {
      setLoading(true);
      const res = await client.listTools();
      if (res) setTools(res.tools);
      setLoading(false);
   }, []);

   useEffect(() => {
      handleRefresh();
   }, []);

   return (
      <AppShell.SectionHeaderAccordionItem
         title="Tools"
         open={open}
         toggle={toggle}
         renderHeaderRight={() => (
            <div className="flex flex-row gap-2 items-center">
               <span className="flex-inline bg-primary/10 px-2 py-1.5 rounded-xl text-sm font-mono leading-none">
                  {tools.length}
               </span>
               <IconButton Icon={TbRefresh} disabled={!open || loading} onClick={handleRefresh} />
            </div>
         )}
      >
         <div className="flex flex-col flex-grow p-3 gap-3">
            <Formy.Input
               type="text"
               placeholder="Search tools"
               value={query}
               onChange={(e) => setQuery(e.target.value)}
            />
            <nav className="flex flex-col flex-1 gap-1">
               {tools
                  .filter((tool) => tool.name.includes(query))
                  .map((tool) => (
                     <AppShell.SidebarLink
                        key={tool.name}
                        className={twMerge(
                           "flex flex-col items-start h-auto py-3 gap-px",
                           content?.name === tool.name ? "active" : "",
                        )}
                        onClick={() => setContent(tool)}
                     >
                        <span className="font-mono">{tool.name}</span>
                        <span className="text-sm text-primary/50">{tool.description}</span>
                     </AppShell.SidebarLink>
                  ))}
            </nav>
         </div>
      </AppShell.SectionHeaderAccordionItem>
   );
}

export function Content() {
   const content = useMcpStore((state) => state.content);
   const [payload, setPayload] = useState<object>(getTemplate(content?.inputSchema));
   const [result, setResult] = useState<object | null>(null);
   const client = getClient();
   const jsonViewerTabsRef = useRef<JsonViewerTabsRef>(null);
   const hasInputSchema =
      content?.inputSchema && Object.keys(content.inputSchema.properties ?? {}).length > 0;

   useEffect(() => {
      setPayload(getTemplate(content?.inputSchema));
      setResult(null);
   }, [content]);

   const handleSubmit = useCallback(async () => {
      if (!content?.name) return;
      const res = await client.callTool({
         name: content.name,
         arguments: payload,
      });
      if (res) {
         setResult(res);
         jsonViewerTabsRef.current?.setSelected("Result");
      }
   }, [payload]);

   if (!content) return null;

   let readableResult = result;
   try {
      readableResult = result
         ? (result as any).content?.[0].text
            ? JSON.parse((result as any).content[0].text)
            : result
         : null;
   } catch (e) {}

   return (
      <div className="flex flex-grow flex-col">
         <AppShell.SectionHeader
            right={
               <Button
                  type="button"
                  disabled={!content?.name}
                  variant="primary"
                  onClick={handleSubmit}
               >
                  Call Tool
               </Button>
            }
         >
            <AppShell.SectionHeaderTitle className="">
               <span className="opacity-50">
                  Tools <span className="opacity-70">/</span>
               </span>{" "}
               {content?.name}
            </AppShell.SectionHeaderTitle>
         </AppShell.SectionHeader>
         <AppShell.Scrollable>
            <div className="flex flex-grow flex-col py-4 px-5">
               <div key={JSON.stringify(content)} className="flex flex-col gap-4">
                  <p className="text-primary/80">{content?.description}</p>

                  {hasInputSchema && (
                     <Form
                        schema={{
                           title: "InputSchema",
                           ...content?.inputSchema,
                        }}
                        initialValues={payload}
                        hiddenSubmit={false}
                        onChange={(value) => {
                           setPayload(value);
                        }}
                     />
                  )}
                  <JsonViewerTabs
                     ref={jsonViewerTabsRef}
                     expand={9}
                     showCopy
                     showSize
                     tabs={{
                        Arguments: { json: payload, title: "Payload", enabled: hasInputSchema },
                        Result: { json: readableResult, title: "Result" },
                        "Tool Configuration": {
                           json: content ?? null,
                           title: "Tool Configuration",
                        },
                     }}
                  />
               </div>
            </div>
         </AppShell.Scrollable>
      </div>
   );
}
