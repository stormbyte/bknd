import type { AppTheme } from "modules/server/AppServer";
import { useBkndWindowContext } from "ui/client/ClientProvider";
import { useBknd } from "ui/client/bknd";

export function useTheme(fallback: AppTheme = "system") {
   const b = useBknd();
   const winCtx = useBkndWindowContext();

   // 1. override
   // 2. config
   // 3. winCtx
   // 4. fallback
   // 5. default
   const override = b?.adminOverride?.color_scheme;
   const config = b?.config.server.admin.color_scheme;
   const win = winCtx.color_scheme;
   const prefersDark =
      typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;

   const theme = override ?? config ?? win ?? fallback;

   return {
      theme: (theme === "system" ? (prefersDark ? "dark" : "light") : theme) as AppTheme,
      prefersDark,
      override,
      config,
      win,
   };
}
