import type { StaticDecode, TSchema } from "@sinclair/typebox";
import { Value, type ValueError } from "@sinclair/typebox/value";
import type { Context, Env, MiddlewareHandler, ValidationTargets } from "hono";
import { validator } from "hono/validator";

type Hook<T, E extends Env, P extends string> = (
   result: { success: true; data: T } | { success: false; errors: ValueError[] },
   c: Context<E, P>,
) => Response | Promise<Response> | void;

export function tbValidator<
   T extends TSchema,
   Target extends keyof ValidationTargets,
   E extends Env,
   P extends string,
   V extends { in: { [K in Target]: StaticDecode<T> }; out: { [K in Target]: StaticDecode<T> } },
>(target: Target, schema: T, hook?: Hook<StaticDecode<T>, E, P>): MiddlewareHandler<E, P, V> {
   // Compile the provided schema once rather than per validation. This could be optimized further using a shared schema
   // compilation pool similar to the Fastify implementation.

   // @ts-expect-error not typed well
   return validator(target, (data, c) => {
      if (Value.Check(schema, data)) {
         // always decode
         const decoded = Value.Decode(schema, data);

         if (hook) {
            const hookResult = hook({ success: true, data: decoded }, c);
            if (hookResult instanceof Response || hookResult instanceof Promise) {
               return hookResult;
            }
         }
         return decoded;
      }
      return c.json({ success: false, errors: [...Value.Errors(schema, data)] }, 400);
   });
}
