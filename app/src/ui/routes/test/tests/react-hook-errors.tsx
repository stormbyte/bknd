import { typeboxResolver } from "@hookform/resolvers/typebox";
import { TextInput } from "@mantine/core";
import { Type } from "@sinclair/typebox";
import { useForm } from "react-hook-form";

const schema = Type.Object({
   example: Type.Optional(Type.String()),
   exampleRequired: Type.String({ minLength: 2 })
});

export default function ReactHookErrors() {
   const {
      register,
      handleSubmit,
      watch,
      formState: { errors }
   } = useForm({
      resolver: typeboxResolver(schema)
   });
   const onSubmit = (data) => console.log(data);

   console.log(watch("example")); // watch input value by passing the name of it
   console.log("errors", errors);

   return (
      /* "handleSubmit" will validate your inputs before invoking "onSubmit" */
      <form onSubmit={handleSubmit(onSubmit)}>
         {/* register your input into the hook by invoking the "register" function */}
         <TextInput defaultValue="test" {...register("example")} />

         {/* @ts-ignore include validation with required or other standard HTML validation rules */}
         <TextInput {...register("exampleRequired")} error={errors.exampleRequired?.message} />

         <div>
            <input type="submit" />
         </div>

         <div>
            {Object.entries(errors).map(([key, value]) => (
               <p key={key}>
                  {/* @ts-ignore */}
                  {key}: {value.message}
               </p>
            ))}
         </div>
      </form>
   );
}
