import { useState } from "react";
import { Button } from "ui/components/buttons/Button";
import { JsonViewer } from "ui/components/code/JsonViewer";
import * as Formy from "ui/components/form/Formy";
import { NativeForm } from "ui/components/form/native-form/NativeForm";

export default function HtmlFormTest() {
   const [data, setData] = useState<any>();
   const [errors, setErrors] = useState<any>();

   return (
      <div className="flex flex-col p-3">
         <h1>html</h1>

         <NativeForm
            className="flex flex-col gap-3"
            validateOn="change"
            onChange={setData}
            onSubmit={(data) => console.log("submit", data)}
            onSubmitInvalid={(errors) => console.log("invalid", errors)}
            onError={setErrors}
            reportValidity
            clean
         >
            <Formy.Input type="text" name="what" minLength={2} maxLength={5} required />
            <div data-role="input-error" data-name="what" />
            <Formy.Input type="number" name="age" step={5} required />
            <Formy.Input type="checkbox" name="verified" />

            <Formy.Input type="text" name="tag" minLength={1} required />
            <Formy.Input type="number" name="tag" />

            <Button type="submit">submit</Button>
         </NativeForm>

         <JsonViewer json={{ data, errors }} expand={9} />
      </div>
   );
}
