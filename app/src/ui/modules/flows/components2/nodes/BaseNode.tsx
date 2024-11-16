import { type ElementProps, Tabs } from "@mantine/core";
import { IconBoltFilled } from "@tabler/icons-react";
import type { Node, NodeProps } from "@xyflow/react";
import { useState } from "react";
import { TbDots, TbPlayerPlayFilled } from "react-icons/tb";
import { twMerge } from "tailwind-merge";
import { IconButton } from "ui/components/buttons/IconButton";
import { DefaultNode } from "ui/components/canvas/components/nodes/DefaultNode";
import type { TFlowNodeData } from "../../hooks/use-flow";

type BaseNodeProps = NodeProps<Node<TFlowNodeData>> & {
   children?: React.ReactNode | React.ReactNode[];
   className?: string;
   Icon?: React.FC<any>;
   onChangeName?: (name: string) => void;
   isInvalid?: boolean;
   tabs?: {
      id: string;
      label: string;
      content: () => React.ReactNode;
   }[];
};

export function BaseNode({ children, className, tabs, Icon, isInvalid, ...props }: BaseNodeProps) {
   const { data } = props;

   function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
      if (props.onChangeName) {
         props.onChangeName(e.target.value);
      }
   }

   return (
      <DefaultNode
         className={twMerge(
            "w-96",
            //props.selected && "ring-4 ring-blue-500/15",
            isInvalid && "ring-8 ring-red-500/15",
            className
         )}
      >
         <Header
            Icon={Icon ?? IconBoltFilled}
            initialValue={data.label}
            onChange={handleNameChange}
         />
         <DefaultNode.Content className="gap-3">{children}</DefaultNode.Content>
         <BaseNodeTabs tabs={tabs} />
      </DefaultNode>
   );
}

const BaseNodeTabs = ({ tabs }: { tabs: BaseNodeProps["tabs"] }) => {
   const [active, setActive] = useState<number>();
   if (!tabs || tabs?.length === 0) return null;

   function handleClick(i: number) {
      return () => {
         setActive((prev) => (prev === i ? undefined : i));
      };
   }

   return (
      <div className="border-t border-t-muted mt-1">
         <div className="flex flex-row justify-start bg-primary/5 px-3 py-2.5 gap-3">
            {tabs.map((tab, i) => (
               <button
                  type="button"
                  key={tab.id}
                  onClick={handleClick(i)}
                  className={twMerge(
                     "text-sm leading-none",
                     i === active ? "font-bold opacity-80" : "font-medium opacity-50"
                  )}
               >
                  {tab.label}
               </button>
            ))}
         </div>
         {typeof active !== "undefined" ? (
            <div className="border-t border-t-muted">{tabs[active]?.content()}</div>
         ) : null}
      </div>
   );
};

const Header = ({
   Icon,
   iconProps,
   rightSection,
   initialValue,
   changable = false,
   onChange
}: {
   Icon: React.FC<any>;
   iconProps?: ElementProps<"svg">;
   rightSection?: React.ReactNode;
   initialValue: string;
   changable?: boolean;
   onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
   const [value, setValue] = useState(initialValue);

   function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      if (!changable) return;
      const v = String(e.target.value);
      if (v.length > 0 && !/^[a-zA-Z_][a-zA-Z0-9_ ]*$/.test(v)) {
         return;
      }

      if (v.length === 25) {
         return;
      }

      const clean = v.toLowerCase().replace(/ /g, "_").replace(/__+/g, "_");

      setValue(clean);
      onChange?.({ ...e, target: { ...e.target, value: clean } });
   }

   return (
      <DefaultNode.Header className="justify-between gap-10">
         <div className="flex flex-row flex-grow gap-1 items-center">
            <Icon {...{ width: 16, height: 16, ...(iconProps ?? {}) }} />
            {changable ? (
               <input
                  type="text"
                  value={value}
                  disabled={!changable}
                  onChange={handleChange}
                  className={twMerge(
                     "font-mono font-semibold bg-transparent rounded-lg outline-none pl-1.5 w-full hover:bg-lightest/30 transition-colors focus:bg-lightest/60"
                  )}
               />
            ) : (
               <span className="font-mono font-semibold bg-transparent  rounded-lg outline-none pl-1.5">
                  {value}
               </span>
            )}
         </div>
         <div className="flex flex-row gap-1">
            {/*{rightSection}*/}
            <IconButton Icon={TbPlayerPlayFilled} size="sm" />
            <IconButton Icon={TbDots} size="sm" />
         </div>
      </DefaultNode.Header>
   );
};
