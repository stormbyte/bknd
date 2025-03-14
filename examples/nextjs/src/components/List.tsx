import type { ReactNode } from "react";

export const List = ({ items = [] }: { items: ReactNode[] }) => (
   <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
      {items.map((item, i) => (
         <li key={i} className={i < items.length - 1 ? "mb-2" : ""}>
            {item}
         </li>
      ))}
   </ol>
);
