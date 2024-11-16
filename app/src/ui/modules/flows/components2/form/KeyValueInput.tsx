import { Input, TextInput } from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { IconButton } from "ui/components/buttons/IconButton";

const ITEM = { key: "", value: "" };

export type KeyValueInputProps = {
   label?: string;
   classNames?: {
      label?: string;
      itemWrapper?: string;
   };
   initialValue?: Record<string, string>;
   onChange?: (value: Record<string, string> | (typeof ITEM)[]) => void;
   mode?: "object" | "array";
   error?: string | any;
};

function toItems(obj: Record<string, string>) {
   if (!obj || Array.isArray(obj)) return [ITEM];
   return Object.entries(obj).map(([key, value]) => ({ key, value }));
}

export const KeyValueInput: React.FC<KeyValueInputProps> = ({
   label,
   initialValue,
   onChange,
   error,
   classNames,
   mode = "object"
}) => {
   const [items, setItems] = useState(initialValue ? toItems(initialValue) : [ITEM]);

   useEffect(() => {
      if (onChange) {
         if (mode === "object") {
            const value = items.reduce((acc, item) => {
               if (item.key && typeof item.value !== "undefined") {
                  acc[item.key] = item.value;
               }
               return acc;
            }, {});
            onChange(value);
         } else {
            onChange(items);
         }
      }
   }, [items]);

   function handleAdd() {
      setItems((prev) => [...prev, ITEM]);
   }

   function handleUpdate(i: number, attr: string) {
      return (e) => {
         const value = e.currentTarget.value;
         setItems((prev) => {
            return prev.map((item, index) => {
               if (index === i) {
                  return { ...item, [attr]: value };
               }
               return item;
            });
         });
      };
   }

   function handleRemove(i: number) {
      return () => {
         setItems((prev) => prev.filter((_, index) => index !== i));
      };
   }

   return (
      <Input.Wrapper className="w-full">
         <div className="flex flex-row w-full justify-between">
            {label ? <Input.Label className={classNames?.label}>{label}</Input.Label> : <div />}
            <IconButton Icon={IconPlus as any} size="xs" onClick={handleAdd} />
         </div>
         <div className={twMerge("flex flex-col gap-2", classNames?.itemWrapper)}>
            {items.map(({ key, value }, i) => (
               <div key={i} className="flex flex-row gap-2 items-center">
                  {items.length > 1 && (
                     <IconButton Icon={IconTrash as any} size="xs" onClick={handleRemove(i)} />
                  )}
                  <TextInput
                     className="w-36"
                     placeholder="key"
                     value={key}
                     classNames={{ wrapper: "font-mono pt-px" }}
                     onChange={handleUpdate(i, "key")}
                  />
                  <TextInput
                     className="w-full"
                     placeholder="value"
                     value={value}
                     classNames={{ wrapper: "font-mono pt-px" }}
                     onChange={handleUpdate(i, "value")}
                  />
               </div>
            ))}
            {error && <Input.Error>{error}</Input.Error>}
         </div>
         {/*<pre>{JSON.stringify(items, null, 2)}</pre>*/}
      </Input.Wrapper>
   );
};
