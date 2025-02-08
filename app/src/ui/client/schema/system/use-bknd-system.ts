import { useBknd } from "ui/client/bknd";
import { useTheme } from "ui/client/use-theme";

export function useBkndSystem() {
   const { config, schema, actions: bkndActions } = useBknd();
   const { theme } = useTheme();

   const actions = {
      theme: {
         set: async (scheme: "light" | "dark") => {
            return await bkndActions.patch("server", "admin", {
               color_scheme: scheme
            });
         },
         toggle: async () => {
            return await bkndActions.patch("server", "admin", {
               color_scheme: theme === "light" ? "dark" : "light"
            });
         }
      }
   };
   const $system = {};

   return {
      $system,
      config: config.server,
      schema: schema.server,
      theme,
      actions
   };
}

export function useBkndSystemTheme() {
   const $sys = useBkndSystem();

   return {
      theme: $sys.theme,
      set: $sys.actions.theme.set,
      toggle: () => $sys.actions.theme.toggle()
   };
}
