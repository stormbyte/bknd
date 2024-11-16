import {
   DragDropContext,
   Draggable,
   type DraggableProvided,
   type DraggableRubric,
   type DraggableStateSnapshot,
   Droppable,
   type DroppableProps
} from "@hello-pangea/dnd";
import { useListState } from "@mantine/hooks";
import { IconGripVertical } from "@tabler/icons-react";
import type React from "react";
import { useEffect } from "react";
import { useId } from "react";

export default function SortableTest() {
   return (
      <div>
         sortable
         <div className="p-4">
            <SortableList
               data={[
                  { id: "C", name: "Carbon" },
                  { id: "N", name: "Nitrogen" },
                  { id: "Y", name: "Yttrium" },
                  { id: "Ba", name: "Barium" },
                  { id: "Ce", name: "Cerium" }
               ]}
               onReordered={(...args) => console.log("reordered", args)}
               onChange={(data) => console.log("changed", data)}
            />
         </div>
      </div>
   );
}

type SortableItemProps<Item = any> = {
   item: Item;
   dnd: { provided: DraggableProvided; snapshot: DraggableStateSnapshot; rubic: DraggableRubric };
};

type SortableListProps<Item = any> = {
   data: Item[];
   extractId?: (item: Item) => string;
   renderItem?: (props: SortableItemProps<Item>) => React.ReactNode;
   dndProps?: Omit<DroppableProps, "children">;
   onReordered?: (from: number, to: number) => void;
   onChange?: (data: Item[]) => void;
};

export function SortableList({
   data = [],
   extractId,
   renderItem,
   dndProps = { droppableId: "sortable-list", direction: "vertical" },
   onReordered,
   onChange
}: SortableListProps) {
   const [state, handlers] = useListState(data);

   function onDragEnd({ destination, source }) {
      const change = { from: source.index, to: destination?.index || 0 };
      handlers.reorder(change);
      onReordered?.(change.from, change.to);
   }

   useEffect(() => {
      onChange?.(state);
   }, [state]);

   const items = state.map((item, index) => {
      const id = extractId ? extractId(item) : useId();
      return (
         <Draggable key={id} index={index} draggableId={id}>
            {(provided, snapshot, rubic) =>
               renderItem ? (
                  renderItem({ ...item, dnd: { provided, snapshot, rubic } })
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
      <DragDropContext onDragEnd={onDragEnd}>
         <Droppable {...dndProps}>
            {(provided) => (
               <div {...provided.droppableProps} ref={provided.innerRef}>
                  {items}
                  {provided.placeholder}
               </div>
            )}
         </Droppable>
      </DragDropContext>
   );
}
