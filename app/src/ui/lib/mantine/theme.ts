import {
   Button,
   type ComboboxProps,
   Menu,
   Modal,
   NumberInput,
   Radio,
   SegmentedControl,
   Select,
   Switch,
   TagsInput,
   TextInput,
   Textarea,
   createTheme
} from "@mantine/core";
import { twMerge } from "tailwind-merge";

// default: https://github.com/mantinedev/mantine/blob/master/src/mantine-core/src/core/MantineProvider/default-theme.ts

export function createMantineTheme(scheme: "light" | "dark"): {
   theme: ReturnType<typeof createTheme>;
   forceColorScheme: "light" | "dark";
} {
   const light = scheme === "light";
   const dark = !light;
   const baseComboboxProps: ComboboxProps = {
      offset: 2,
      transitionProps: { transition: "pop", duration: 75 }
   };

   const input =
      "bg-muted/40 border-transparent disabled:bg-muted/50 disabled:text-primary/50 focus:border-zinc-500";

   return {
      theme: createTheme({
         components: {
            Button: Button.extend({
               vars: (theme, props) => ({
                  // https://mantine.dev/styles/styles-api/
                  root: {
                     "--button-height": "auto"
                  }
               }),
               classNames: (theme, props) => ({
                  root: twMerge("px-3 py-2 rounded-md h-auto")
               }),
               defaultProps: {
                  size: "md",
                  variant: light ? "filled" : "white"
               }
            }),
            Switch: Switch.extend({
               defaultProps: {
                  size: "md",
                  color: light ? "dark" : "blue"
               }
            }),
            Select: Select.extend({
               classNames: (theme, props) => ({
                  //input: "focus:border-primary/50 bg-transparent disabled:text-primary",
                  input,
                  dropdown: `bknd-admin ${scheme} bg-background border-primary/20`
               }),
               defaultProps: {
                  checkIconPosition: "right",
                  comboboxProps: baseComboboxProps
               }
            }),
            TagsInput: TagsInput.extend({
               defaultProps: {
                  comboboxProps: baseComboboxProps
               }
            }),
            Radio: Radio.extend({
               defaultProps: {
                  classNames: {
                     body: "items-center"
                  }
               }
            }),
            TextInput: TextInput.extend({
               classNames: (theme, props) => ({
                  wrapper: "leading-none",
                  //input: "focus:border-primary/50 bg-transparent disabled:text-primary"
                  input
               })
            }),
            NumberInput: NumberInput.extend({
               classNames: (theme, props) => ({
                  wrapper: "leading-none",
                  input
               })
            }),
            Textarea: Textarea.extend({
               classNames: (theme, props) => ({
                  wrapper: "leading-none",
                  input
               })
            }),
            Modal: Modal.extend({
               classNames: (theme, props) => ({
                  ...props.classNames,
                  root: `bknd-admin ${scheme} ${props.className ?? ""} `,
                  content: "bg-lightest border border-primary/10",
                  overlay: "backdrop-blur"
               })
            }),
            Menu: Menu.extend({
               defaultProps: {
                  offset: 2
               },

               classNames: (theme, props) => ({
                  dropdown: "!rounded-lg !px-1",
                  item: "!rounded-md !text-[14px]"
               })
            }),
            SegmentedControl: SegmentedControl.extend({
               classNames: (theme, props) => ({
                  root: light ? "bg-primary/5" : "bg-lightest/60",
                  indicator: light ? "bg-background" : "bg-primary/15"
               })
            })
         },
         primaryColor: "dark",
         primaryShade: 9
      }),
      forceColorScheme: scheme
   };
}
