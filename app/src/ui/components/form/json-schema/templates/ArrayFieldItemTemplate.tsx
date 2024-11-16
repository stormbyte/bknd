import type {
   ArrayFieldTemplateItemType,
   FormContextType,
   RJSFSchema,
   StrictRJSFSchema,
} from "@rjsf/utils";
import { type CSSProperties, Children, cloneElement, isValidElement } from "react";
import { twMerge } from "tailwind-merge";

/** The `ArrayFieldItemTemplate` component is the template used to render an items of an array.
 *
 * @param props - The `ArrayFieldTemplateItemType` props for the component
 */
export default function ArrayFieldItemTemplate<
   T = any,
   S extends StrictRJSFSchema = RJSFSchema,
   F extends FormContextType = any,
>(props: ArrayFieldTemplateItemType<T, S, F>) {
   const {
      children,
      className,
      disabled,
      hasToolbar,
      hasMoveDown,
      hasMoveUp,
      hasRemove,
      hasCopy,
      index,
      onCopyIndexClick,
      onDropIndexClick,
      onReorderClick,
      readonly,
      registry,
      uiSchema,
   } = props;
   const { CopyButton, MoveDownButton, MoveUpButton, RemoveButton } =
      registry.templates.ButtonTemplates;

   return (
      <div className={twMerge("flex flex-row w-full overflow-hidden", className)}>
         {hasToolbar && (
            <div className="flex flex-col gap-1 p-1 mr-2">
               {(hasMoveUp || hasMoveDown) && (
                  <MoveUpButton
                     disabled={disabled || readonly || !hasMoveUp}
                     onClick={onReorderClick(index, index - 1)}
                     uiSchema={uiSchema}
                     registry={registry}
                  />
               )}
               {(hasMoveUp || hasMoveDown) && (
                  <MoveDownButton
                     disabled={disabled || readonly || !hasMoveDown}
                     onClick={onReorderClick(index, index + 1)}
                     uiSchema={uiSchema}
                     registry={registry}
                  />
               )}
               {hasCopy && (
                  <CopyButton
                     disabled={disabled || readonly}
                     onClick={onCopyIndexClick(index)}
                     uiSchema={uiSchema}
                     registry={registry}
                  />
               )}
               {hasRemove && (
                  <RemoveButton
                     disabled={disabled || readonly}
                     onClick={onDropIndexClick(index)}
                     uiSchema={uiSchema}
                     registry={registry}
                  />
               )}
            </div>
         )}
         <div className="flex flex-col flex-grow">{children}</div>
      </div>
   );
}
