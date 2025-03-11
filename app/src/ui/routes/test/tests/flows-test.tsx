import { type ElementProps, Input, Select, TagsInput, TextInput } from "@mantine/core";
import { useToggle } from "@mantine/hooks";
import {
   IconBolt,
   IconBoltFilled,
   IconDatabase,
   IconGlobeFilled,
   IconMinus,
   IconPlayerPlay,
   IconPlus,
   IconTrash,
   IconWorld,
} from "@tabler/icons-react";
import { useState } from "react";
import { TbPlayerPlayFilled } from "react-icons/tb";
import { DefaultNode } from "ui/components/canvas/components/nodes/DefaultNode";
import { KeyValueInput } from "ui/modules/flows/components2/form/KeyValueInput";
import type { AppFlowsSchema } from "../../../../modules";
import { Button } from "../../../components/buttons/Button";
import { IconButton } from "../../../components/buttons/IconButton";
import { JsonEditor } from "../../../components/code/JsonEditor";
import { FloatingSelect } from "../../../components/form/FloatingSelect/FloatingSelect";
import { SegmentedControl } from "../../../components/form/SegmentedControl";
import { Scrollable } from "../../../layouts/AppShell/AppShell";

const TRIGGERS = {
   http: {
      type: "http",
      config: {
         mode: "sync",
         method: "GET",
         response_type: "json",
         path: "/trigger_http",
      },
   },
};

const TASKS = {
   fetch: {
      type: "fetch",
      params: {
         method: "GET",
         headers: [],
         url: "https://jsonplaceholder.typicode.com/todos/1",
      },
   },
};

export default function FlowsTest() {
   return (
      <Scrollable>
         <div className="flex flex-col justify-center p-4 w-full h-full items-center gap-10">
            <TriggerComponent />
            <TaskDbQueryMultipleComponent />
            <TaskFetchComponent />
         </div>
      </Scrollable>
   );
}

const NodeHeader = ({
   Icon,
   iconProps,
   rightSection,
   initialValue,
   onChange,
}: {
   Icon: React.FC<any>;
   iconProps?: ElementProps<"svg">;
   rightSection?: React.ReactNode;
   initialValue: string;
   onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
   <DefaultNode.Header className="justify-between gap-3">
      <div className="flex flex-row flex-grow gap-1 items-center">
         <Icon {...{ width: 16, height: 16, ...(iconProps ?? {}) }} />
         <input
            type="text"
            value={initialValue}
            onChange={onChange || (() => {})}
            className="font-mono font-semibold bg-transparent w-full rounded-lg outline-none pl-1.5 hover:bg-background/30 transition-colors focus:bg-background/60"
         />
      </div>
      <div>
         {/*{rightSection}*/}
         <IconButton Icon={TbPlayerPlayFilled} size="sm" />
      </div>
   </DefaultNode.Header>
);

const TriggerComponent = () => {
   return (
      <DefaultNode className="w-96">
         <NodeHeader Icon={IconBoltFilled} initialValue="test_flow" />
         <DefaultNode.Content className="gap-3">
            <div className="flex flex-row justify-between items-center">
               <SegmentedControl
                  label="Trigger Type"
                  defaultValue="manual"
                  data={[
                     { label: "Manual", value: "manual" },
                     { label: "HTTP", value: "http" },
                     { label: "Event", value: "event", disabled: true },
                  ]}
               />
               <SegmentedControl
                  label="Execution Mode"
                  defaultValue="async"
                  data={[
                     { label: "Async", value: "async" },
                     { label: "Sync", value: "sync" },
                  ]}
               />
            </div>
            <div className="flex flex-row gap-2 items-center">
               <Select
                  className="w-36"
                  label="Method"
                  defaultValue="GET"
                  data={["GET", "POST", "PATCH", "PUT", "DEL"]}
               />
               <TextInput
                  className="w-full"
                  label="Mapping Path"
                  placeholder="/trigger_http"
                  classNames={{ wrapper: "font-mono pt-px" }}
               />
            </div>
            <div className="flex flex-row gap-2 items-center">
               <SegmentedControl
                  className="w-full"
                  label="Response Type"
                  defaultValue="json"
                  data={[
                     { label: "JSON", value: "json" },
                     { label: "HTML", value: "html" },
                     { label: "Text", value: "text" },
                  ]}
               />
            </div>
         </DefaultNode.Content>
      </DefaultNode>
   );
};

const TaskFetchComponent = () => {
   const [advanced, toggle] = useToggle([true, false]);

   return (
      <DefaultNode className="w-[400px]">
         <NodeHeader Icon={IconWorld} initialValue="fetch_something" />
         <DefaultNode.Content className="gap-3">
            <div className="flex flex-row gap-2 items-center">
               <Select
                  className="w-36"
                  label="Method"
                  defaultValue="GET"
                  data={["GET", "POST", "PATCH", "PUT", "DEL"]}
               />
               <TextInput
                  className="w-full"
                  label="Mapping Path"
                  placeholder="/trigger_http"
                  classNames={{ wrapper: "font-mono pt-px" }}
               />
            </div>

            <Button
               onClick={toggle as any}
               className="justify-center"
               size="small"
               variant="ghost"
               iconSize={14}
               IconLeft={advanced ? IconMinus : IconPlus}
            >
               More options
            </Button>

            {advanced && (
               <>
                  <KeyValueInput label="URL query" />
                  <KeyValueInput label="Headers" />
                  <div className="flex flex-row gap-2 items-center">
                     <Input.Wrapper className="w-full">
                        <Input.Label>Body</Input.Label>
                        <SegmentedControl data={["None", "Form", "JSON"]} defaultValue="JSON" />
                        <KeyValueInput label="" />
                     </Input.Wrapper>
                  </div>
               </>
            )}
         </DefaultNode.Content>
      </DefaultNode>
   );
};

const TaskDbQueryMultipleComponent = () => {
   return (
      <DefaultNode className="w-[400px]">
         <NodeHeader Icon={IconDatabase} initialValue="query_multiple" />
         <DefaultNode.Content className="gap-3">
            <div className="flex flex-row gap-2 items-center">
               <Select
                  className="w-6/12"
                  label="Entity"
                  placeholder="Select entity"
                  data={["users", "posts", "comments"]}
               />
               <Select
                  className="w-4/12"
                  label="Sort by"
                  data={["id", "title", "username"]}
                  defaultValue="id"
               />
               <Select
                  className="w-2/12"
                  label="Sort dir"
                  data={["asc", "desc"]}
                  defaultValue="asc"
               />
            </div>

            <TagsInput
               label="Select properties"
               data={["id", "title", "username"]}
               placeholder="All selected"
            />
            <TagsInput
               label="Embed relations"
               data={["posts", "comments"]}
               placeholder="None selected"
            />

            <Input.Wrapper className="w-full">
               <Input.Label>Where object</Input.Label>
               <div className="text-sm placeholder:text-slate-400 placeholder:opacity-80">
                  <JsonEditor basicSetup={{ lineNumbers: false, foldGutter: false }} />
               </div>
            </Input.Wrapper>
         </DefaultNode.Content>
      </DefaultNode>
   );
};
