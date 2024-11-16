import { useState } from "react";
export type AppTheme = "light" | "dark" | string;

export function useSetTheme(initialTheme: AppTheme = "light") {
   const [theme, _setTheme] = useState(initialTheme);

   const $html = document.querySelector("#bknd-admin")!;
   function setTheme(newTheme: AppTheme) {
      $html?.classList.remove("dark", "light");
      $html?.classList.add(newTheme);
      _setTheme(newTheme);

      // @todo: just a quick switcher config update test
      fetch("/api/system/config/patch/server/admin", {
         method: "PATCH",
         headers: {
            "Content-Type": "application/json"
         },
         body: JSON.stringify({ color_scheme: newTheme })
      })
         .then((res) => res.json())
         .then((data) => {
            console.log("theme updated", data);
         });
   }

   return { theme, setTheme };
}
