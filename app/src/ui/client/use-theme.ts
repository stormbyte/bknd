import { useBknd } from "ui/client/bknd";
import { create } from "zustand";
import { combine, persist } from "zustand/middleware";

const themes = ["dark", "light", "system"] as const;
export type AppTheme = (typeof themes)[number];

const themeStore = create(
   persist(
      combine({ theme: null as AppTheme | null }, (set) => ({
         setTheme: (theme: AppTheme | any) => {
            if (themes.includes(theme)) {
               document.startViewTransition(() => {
                  set({ theme });
               });
            }
         },
      })),
      {
         name: "bknd-admin-theme",
      },
   ),
);

export function useTheme(fallback: AppTheme = "system") {
   const b = useBknd();
   const theme_state = themeStore((state) => state.theme);
   const theme_set = themeStore((state) => state.setTheme);

   // 1. override
   // 2. local storage
   // 3. fallback
   // 4. default
   const override = b?.options?.theme;
   const prefersDark =
      typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;

   const theme = override ?? theme_state ?? fallback;

   return {
      theme: (theme === "system" ? (prefersDark ? "dark" : "light") : theme) as AppTheme,
      value: theme,
      themes,
      setTheme: theme_set,
      state: theme_state,
      prefersDark,
      override,
   };
}
