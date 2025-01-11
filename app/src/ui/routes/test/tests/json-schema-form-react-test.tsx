import { Form, type Validator } from "json-schema-form-react";
import { useState } from "react";

import { type TSchema, Type } from "@sinclair/typebox";
import { Value, type ValueError } from "@sinclair/typebox/value";

class TypeboxValidator implements Validator<ValueError> {
   async validate(schema: TSchema, data: any) {
      return Value.Check(schema, data) ? [] : [...Value.Errors(schema, data)];
   }
}
const validator = new TypeboxValidator();

const schema = Type.Object({
   name: Type.String(),
   age: Type.Optional(Type.Number())
});

export default function JsonSchemaFormReactTest() {
   const [data, setData] = useState(null);

   return (
      <>
         <Form
            schema={schema}
            onChange={setData}
            onSubmit={setData}
            validator={validator}
            validationMode="change"
         >
            {({ errors, dirty, reset }) => (
               <>
                  <div>
                     <b>
                        Form {dirty ? "*" : ""} (valid: {errors.length === 0 ? "valid" : "invalid"})
                     </b>
                  </div>
                  <div>
                     <input type="text" name="name" />
                     <input type="number" name="age" />
                  </div>
                  <div>
                     <button type="submit">submit</button>
                     <button type="button" onClick={reset}>
                        reset
                     </button>
                  </div>
               </>
            )}
         </Form>
         <pre>{JSON.stringify(data, null, 2)}</pre>
      </>
   );
}
