import { Label } from "../templates/FieldTemplate";
import { CheckboxWidget } from "./CheckboxWidget";
import CheckboxesWidget from "./CheckboxesWidget";
import JsonWidget from "./JsonWidget";
import RadioWidget from "./RadioWidget";
import SelectWidget from "./SelectWidget";

const WithLabel = (WrappedComponent, kind?: string) => {
   return (props) => {
      const hideLabel =
         !props.label ||
         props.uiSchema["ui:options"]?.hideLabel ||
         props.options?.hideLabel ||
         props.hideLabel;
      return (
         <>
            {!hideLabel && <Label label={props.label} required={props.required} id={props.id} />}
            <WrappedComponent {...props} />
         </>
      );
   };
};

export const widgets = {
   RadioWidget: RadioWidget,
   CheckboxWidget: WithLabel(CheckboxWidget),
   SelectWidget: WithLabel(SelectWidget, "select"),
   CheckboxesWidget: WithLabel(CheckboxesWidget),
   JsonWidget: WithLabel(JsonWidget),
};
