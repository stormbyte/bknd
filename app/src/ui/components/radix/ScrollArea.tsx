import * as ReactScrollArea from "@radix-ui/react-scroll-area";

export const ScrollArea = ({ children, className }: any) => (
   <ReactScrollArea.Root className={`${className} `}>
      <ReactScrollArea.Viewport className="w-full h-full ">
         {children}
      </ReactScrollArea.Viewport>
      <ReactScrollArea.Scrollbar
         className="ScrollAreaScrollbar"
         orientation="vertical"
      >
         <ReactScrollArea.Thumb className="ScrollAreaThumb" />
      </ReactScrollArea.Scrollbar>
      <ReactScrollArea.Scrollbar
         className="ScrollAreaScrollbar"
         orientation="horizontal"
      >
         <ReactScrollArea.Thumb className="ScrollAreaThumb" />
      </ReactScrollArea.Scrollbar>
      <ReactScrollArea.Corner className="ScrollAreaCorner" />
   </ReactScrollArea.Root>
);
