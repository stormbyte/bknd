import { useBknd } from "ui";

export function useTheme(): { theme: "light" | "dark" } {
   const b = useBknd();
   const theme = b.app.getAdminConfig().color_scheme as any;

   return { theme };
}
