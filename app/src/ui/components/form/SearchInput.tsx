import type { ElementProps } from "@mantine/core";
import { TbSearch } from "react-icons/tb";

export const SearchInput = (props: ElementProps<"input">) => (
   <div className="w-full relative shadow-sm">
      <div className="absolute h-full flex items-center px-3 mt-[0.5px] text-zinc-500">
         <TbSearch size={18} />
      </div>
      <input
         className="bg-transparent border-muted border rounded-md py-2 pl-10 pr-3 w-full outline-none focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent transition-all duration-200 ease-in-out"
         type="text"
         placeholder="Search"
         {...props}
      />
   </div>
);
