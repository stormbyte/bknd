import Image from "next/image";
import type { ReactNode } from "react";
import { Footer } from "./Footer";

export default async function Layout({
   children,
}: {
   children: React.ReactNode;
}) {
   return (
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
         <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
            <div className="flex flex-row items-center ">
               <Image
                  className="dark:invert"
                  src="/next.svg"
                  alt="Next.js logo"
                  width={180}
                  height={38}
                  priority
               />
               <div className="ml-3.5 mr-2 font-mono opacity-70">&amp;</div>
               <Image
                  className="dark:invert"
                  src="/bknd.svg"
                  alt="bknd logo"
                  width={183}
                  height={59}
                  priority
               />
            </div>

            {children}
         </main>
         <Footer />
      </div>
   );
}

export const Buttons = () => (
   <div className="flex gap-4 items-center flex-col sm:flex-row">
      <a
         className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
         href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
         target="_blank"
         rel="noopener noreferrer"
      >
         <Image
            className="dark:invert"
            src="/vercel.svg"
            alt="Vercel logomark"
            width={20}
            height={20}
         />
         Deploy now
      </a>
      <a
         className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
         href="https://docs.bknd.io/integration/nextjs"
         target="_blank"
         rel="noopener noreferrer"
      >
         Read our docs
      </a>
   </div>
);

export const List = ({ items = [] }: { items: ReactNode[] }) => (
   <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
      {items.map((item, i) => (
         <li key={i} className={i < items.length - 1 ? "mb-2" : ""}>
            {item}
         </li>
      ))}
   </ol>
);
