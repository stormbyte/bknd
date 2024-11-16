import {
   DragDropContext,
   Draggable,
   type DraggableProvided,
   type DraggableRubric,
   type DraggableStateSnapshot,
   Droppable,
   type DroppableProps
} from "@hello-pangea/dnd";
import type { ElementProps } from "@mantine/core";
import { useListState } from "@mantine/hooks";
import { IconGripVertical } from "@tabler/icons-react";
import type React from "react";
import { useEffect, useId } from "react";

export type SortableItemProps = {
   provided: DraggableProvided;
   snapshot: DraggableStateSnapshot;
   rubic: DraggableRubric;
};

type SortableListProps<Item = any> = ElementProps<"div"> & {
   data: Item[];
   extractId?: (item: Item) => string;
   renderItem?: (props: Item & SortableItemProps, index: number) => React.ReactNode;
   dndProps?: Omit<DroppableProps, "children">;
   onReordered?: (from: number, to: number) => void;
   onChange?: (data: Item[]) => void;
   disableIndices?: number[];
};

export function SortableList({
   data = [],
   extractId,
   renderItem,
   dndProps = { droppableId: "sortable-list", direction: "vertical" },
   onReordered,
   onChange,
   disableIndices = [],
   ...props
}: SortableListProps) {
   //const [state, handlers] = useListState(data);

   function onDragEnd({ destination, source }) {
      if (disableIndices.includes(source.index) || disableIndices.includes(destination.index))
         return;

      const change = { from: source.index, to: destination?.index || 0 };
      //handlers.reorder(change);
      onReordered?.(change.from, change.to);
   }

   /*function onDragUpdate({ destination, source }) {
      if (disableIndices.includes(source.index) || disableIndices.includes(destination.index))
         return;

      const change = { from: source.index, to: destination?.index || 0 };
      //handlers.reorder(change);
      onReordered?.(change.from, change.to);
   }*/

   /*useEffect(() => {
      handlers.setState(data);
   }, [data]);*/

   const items = data.map((item, index) => {
      const id = extractId ? extractId(item) : useId();
      return (
         <Draggable
            key={id}
            index={index}
            draggableId={id}
            isDragDisabled={disableIndices.includes(index)}
         >
            {(provided, snapshot, rubic) =>
               renderItem ? (
                  renderItem({ ...item, dnd: { provided, snapshot, rubic } }, index)
               ) : (
                  <div
                     className="flex flex-row gap-2 p-2 border border-gray-200 rounded-md mb-3 bg-white items-center"
                     ref={provided.innerRef}
                     {...provided.draggableProps}
                  >
                     <div {...provided.dragHandleProps}>
                        <IconGripVertical className="size-5" stroke={1.5} />
                     </div>
                     <p>{JSON.stringify(item)}</p>
                  </div>
               )
            }
         </Draggable>
      );
   });

   return (
      <DragDropContext onDragEnd={onDragEnd} /*onDragUpdate={onDragUpdate}*/>
         <Droppable {...dndProps}>
            {(provided) => (
               <div {...props} {...provided.droppableProps} ref={provided.innerRef}>
                  {items}
                  {provided.placeholder}
               </div>
            )}
         </Droppable>
      </DragDropContext>
   );
}
