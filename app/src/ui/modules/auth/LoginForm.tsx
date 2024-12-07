import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Type } from "core/utils";
import type { ComponentPropsWithoutRef } from "react";
import { useForm } from "react-hook-form";
import { twMerge } from "tailwind-merge";
import { Button } from "ui/components/buttons/Button";
import * as Formy from "ui/components/form/Formy";

export type LoginFormProps = Omit<ComponentPropsWithoutRef<"form">, "onSubmit"> & {
   className?: string;
   formData?: any;
};

const schema = Type.Object({
   email: Type.String({
      pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$"
   }),
   password: Type.String({
      minLength: 8 // @todo: this should be configurable
   })
});

export function LoginForm({ formData, className, method = "POST", ...props }: LoginFormProps) {
   const {
      register,
      formState: { isValid, errors }
   } = useForm({
      mode: "onChange",
      defaultValues: formData,
      resolver: typeboxResolver(schema)
   });

   return (
      <form {...props} method={method} className={twMerge("flex flex-col gap-3 w-full", className)}>
         <Formy.Group>
            <Formy.Label htmlFor="email">Email address</Formy.Label>
            <Formy.Input type="email" {...register("email")} />
         </Formy.Group>
         <Formy.Group>
            <Formy.Label htmlFor="password">Password</Formy.Label>
            <Formy.Input type="password" {...register("password")} />
         </Formy.Group>

         <Button
            type="submit"
            variant="primary"
            size="large"
            className="w-full mt-2 justify-center"
            disabled={!isValid}
         >
            Sign in
         </Button>
      </form>
   );
}
