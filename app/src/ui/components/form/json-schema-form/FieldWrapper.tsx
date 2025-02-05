import { Popover } from "@mantine/core";
import { IconBug } from "@tabler/icons-react";
import type { JsonError } from "json-schema-library";
import type { JSONSchema } from "json-schema-to-ts";
import { Children, type ReactElement, type ReactNode, cloneElement } from "react";
import { IconButton } from "ui/components/buttons/IconButton";
import { JsonViewer } from "ui/components/code/JsonViewer";
import * as Formy from "ui/components/form/Formy";
import { getLabel } from "./utils";

export type FieldwrapperProps = {
   pointer: string;
   label?: string | false;
   required?: boolean;
   errors?: JsonError[];
   schema?: Exclude<JSONSchema, boolean>;
   debug?: object;
   wrapper?: "group" | "fieldset";
   hidden?: boolean;
   children: ReactElement | ReactNode;
};

export function FieldWrapper({
   pointer,
   label: _label,
   required,
   errors = [],
   schema,
   debug = {},
   wrapper,
   hidden,
   children
}: FieldwrapperProps) {
   const examples = schema?.examples || [];
   const examplesId = `${pointer}-examples`;
   const description = schema?.description;
   const label =
      typeof _label !== "undefined" ? _label : schema ? getLabel(pointer, schema) : pointer;

   return (
      <Formy.Group
         error={errors.length > 0}
         as={wrapper === "fieldset" ? "fieldset" : "div"}
         className={hidden ? "hidden" : "relative"}
      >
         {/*<div className="absolute right-0 top-0">
            <Popover>
               <Popover.Target>
                  <IconButton Icon={IconBug} size="xs" className="opacity-30" />
               </Popover.Target>
               <Popover.Dropdown>
                  <JsonViewer
                     json={{ ...debug, pointer, required, schema, errors }}
                     expand={6}
                     className="p-0"
                  />
               </Popover.Dropdown>
            </Popover>
         </div>*/}

         {label && (
            <Formy.Label as={wrapper === "fieldset" ? "legend" : "label"} htmlFor={pointer}>
               {label} {required && <span className="font-medium opacity-30">*</span>}
            </Formy.Label>
         )}
         <div className="flex flex-row gap-2">
            <div className="flex flex-1 flex-col gap-3">
               {children}
               {/*{Children.count(children) === 1
                  ? cloneElement(children, {
                       list: examples.length > 0 ? examplesId : undefined
                    })
                  : children}
               {examples.length > 0 && (
                  <datalist id={examplesId}>
                     {examples.map((e, i) => (
                        <option key={i} value={e as any} />
                     ))}
                  </datalist>
               )}*/}
            </div>
         </div>
         {description && <Formy.Help>{description}</Formy.Help>}
         {errors.length > 0 && (
            <Formy.ErrorMessage>{errors.map((e) => e.message).join(", ")}</Formy.ErrorMessage>
         )}
      </Formy.Group>
   );
}
