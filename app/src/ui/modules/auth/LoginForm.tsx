import type { ValueError } from "@sinclair/typebox/value";
import { type TSchema, Type, Value } from "core/utils";
import { Form, type Validator } from "json-schema-form-react";
import type { ComponentPropsWithoutRef } from "react";
import { twMerge } from "tailwind-merge";
import { Button } from "ui/components/buttons/Button";
import * as Formy from "ui/components/form/Formy";

export type LoginFormProps = Omit<ComponentPropsWithoutRef<"form">, "onSubmit"> & {
   className?: string;
   formData?: any;
};

class TypeboxValidator implements Validator<ValueError> {
   async validate(schema: TSchema, data: any) {
      return Value.Check(schema, data) ? [] : [...Value.Errors(schema, data)];
   }
}
const validator = new TypeboxValidator();

const schema = Type.Object({
   email: Type.String({
      pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$"
   }),
   password: Type.String({
      minLength: 8 // @todo: this should be configurable
   })
});

export function LoginForm({ formData, className, ...props }: LoginFormProps) {
   return (
      <Form
         method="POST"
         {...props}
         schema={schema}
         validator={validator}
         validationMode="change"
         className={twMerge("flex flex-col gap-3 w-full", className)}
      >
         {({ errors, submitting }) => (
            <>
               <pre>{JSON.stringify(errors, null, 2)}</pre>
               <Formy.Group>
                  <Formy.Label htmlFor="email">Email address</Formy.Label>
                  <Formy.Input type="email" name="email" />
               </Formy.Group>
               <Formy.Group>
                  <Formy.Label htmlFor="password">Password</Formy.Label>
                  <Formy.Input type="password" name="password" />
               </Formy.Group>

               <Button
                  type="submit"
                  variant="primary"
                  size="large"
                  className="w-full mt-2 justify-center"
                  disabled={errors.length > 0 || submitting}
               >
                  Sign in
               </Button>
            </>
         )}
      </Form>
   );
}
