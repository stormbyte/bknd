import { type FieldApi, useForm } from "@tanstack/react-form";
import { Type, type TypeInvalidError, parse } from "core/utils";

import { Button } from "ui/components/buttons/Button";
import * as Formy from "ui/components/form/Formy";

type LoginFormProps = {
   onSubmitted?: (value: { email: string; password: string }) => Promise<void>;
};

export function LoginForm({ onSubmitted }: LoginFormProps) {
   const form = useForm({
      defaultValues: {
         email: "",
         password: ""
      },
      onSubmit: async ({ value }) => {
         onSubmitted?.(value);
      },
      defaultState: {
         canSubmit: false,
         isValid: false
      },
      validatorAdapter: () => {
         function validate(
            { value, fieldApi }: { value: any; fieldApi: FieldApi<any, any> },
            fn: any
         ): any {
            if (fieldApi.form.state.submissionAttempts === 0) return;

            try {
               parse(fn, value);
            } catch (e) {
               return (e as TypeInvalidError).errors
                  .map((error) => error.schema.error ?? error.message)
                  .join(", ");
            }
         }

         return { validate, validateAsync: validate };
      }
   });

   function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      e.stopPropagation();
      void form.handleSubmit();
   }

   return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full" noValidate>
         <form.Field
            name="email"
            validators={{
               onChange: Type.String({
                  pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$"
               })
            }}
            children={(field) => (
               <Formy.Group error={field.state.meta.errors.length > 0}>
                  <Formy.Label htmlFor={field.name}>Email address</Formy.Label>
                  <Formy.Input
                     type="email"
                     id={field.name}
                     name={field.name}
                     value={field.state.value}
                     onChange={(e) => field.handleChange(e.target.value)}
                     onBlur={field.handleBlur}
                  />
               </Formy.Group>
            )}
         />
         <form.Field
            name="password"
            validators={{
               onChange: Type.String({
                  minLength: 8
               })
            }}
            children={(field) => (
               <Formy.Group error={field.state.meta.errors.length > 0}>
                  <Formy.Label htmlFor={field.name}>Password</Formy.Label>
                  <Formy.Input
                     type="password"
                     id={field.name}
                     name={field.name}
                     value={field.state.value}
                     onChange={(e) => field.handleChange(e.target.value)}
                     onBlur={field.handleBlur}
                  />
               </Formy.Group>
            )}
         />
         <form.Subscribe
            selector={(state) => {
               //console.log("state", state, Object.values(state.fieldMeta));
               const fieldMeta = Object.values(state.fieldMeta).map((f) => f.isDirty);
               const allDirty = fieldMeta.length > 0 ? fieldMeta.reduce((a, b) => a && b) : false;
               return [allDirty, state.isSubmitting];
            }}
            children={([allDirty, isSubmitting]) => {
               return (
                  <Button
                     type="submit"
                     variant="primary"
                     size="large"
                     className="w-full mt-2 justify-center"
                     disabled={!allDirty || isSubmitting}
                  >
                     Sign in
                  </Button>
               );
            }}
         />
      </form>
   );
}
