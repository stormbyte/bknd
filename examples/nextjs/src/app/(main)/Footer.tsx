"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

export function Footer() {
   const pathname = usePathname();

   return (
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
         <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4"
            href={pathname === "/" ? "/ssr" : "/"}
         >
            <Image aria-hidden src="/file.svg" alt="File icon" width={16} height={16} />
            {pathname === "/" ? "SSR" : "Home"}
         </a>
         <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4"
            href="/admin"
         >
            <Image aria-hidden src="/window.svg" alt="Window icon" width={16} height={16} />
            Admin
         </a>
         <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4"
            href="https://bknd.io"
            target="_blank"
            rel="noopener noreferrer"
         >
            <Image aria-hidden src="/globe.svg" alt="Globe icon" width={16} height={16} />
            Go to bknd.io →
         </a>
      </footer>
   );
}
