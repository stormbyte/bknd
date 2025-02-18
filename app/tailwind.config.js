import tailwindCssAnimate from "tailwindcss-animate";

/** @type {import("tailwindcss").Config} */
export default {
   content: ["./index.html", "./src/ui/**/*.tsx", "./src/ui/lib/mantine/theme.ts"],
   darkMode: "selector",
   theme: {
      extend: {
         colors: {
            primary: "rgb(var(--color-primary) / <alpha-value>)",
            background: "rgb(var(--color-background) / <alpha-value>)",
            muted: "rgb(var(--color-muted) / <alpha-value>)",
            lightest: "rgb(var(--color-lightest) / <alpha-value>)",
            darkest: "rgb(var(--color-darkest) / <alpha-value>)"
         }
      }
   },
   plugins: [tailwindCssAnimate]
};
