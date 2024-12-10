import { useBknd } from "ui/client/bknd";

export function useTheme(): { theme: "light" | "dark" } {
   const b = useBknd();
   const theme = b.app.getAdminConfig().color_scheme as any;

   return { theme };
}
