import { BooleanInputMantine } from "./BooleanInputMantine";
import { DateInput, Input, Textarea } from "./components";

export const formElementFactory = (element: string, props: any) => {
   switch (element) {
      case "date":
         return DateInput;
      case "boolean":
         return BooleanInputMantine;
      case "textarea":
         return Textarea;
      default:
         return Input;
   }
};

export * from "./components";
