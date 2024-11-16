import { useLayoutEffect } from "react";

export function useBrowserTitle(path: string[] = []) {
   useLayoutEffect(() => {
      const prefix = "BKND";
      document.title = [prefix, ...path].join(" / ");
   });
}
