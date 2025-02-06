import { useBkndWindowContext } from "ui/client/ClientProvider";
import { useBknd } from "ui/client/bknd";

export type Theme = "light" | "dark";

export function useTheme(fallback: Theme = "light"): { theme: Theme } {
   const b = useBknd();
   const winCtx = useBkndWindowContext();
   if (b) {
      if (b?.adminOverride?.color_scheme) {
         return { theme: b.adminOverride.color_scheme };
      } else if (!b.fallback) {
         return { theme: b.config.server.admin.color_scheme ?? fallback };
      }
   }

   return { theme: winCtx.color_scheme ?? fallback };
}
