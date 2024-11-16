type Field<Type, Required extends true | false> = {
   _type: Type;
   _required: Required;
};
type TextField<Required extends true | false = false> = Field<string, Required> & {
   _type: string;
   required: () => TextField<true>;
};
type NumberField<Required extends true | false = false> = Field<number, Required> & {
   _type: number;
   required: () => NumberField<true>;
};

type Entity<Fields extends Record<string, Field<any, any>> = {}> = { name: string; fields: Fields };

function entity<Fields extends Record<string, Field<any, any>>>(
   name: string,
   fields: Fields,
): Entity<Fields> {
   return { name, fields };
}

function text(): TextField<false> {
   return {} as any;
}
function number(): NumberField<false> {
   return {} as any;
}

const field1 = text();
const field1_req = text().required();
const field2 = number();
const user = entity("users", {
   name: text().required(),
   bio: text(),
   age: number(),
   some: number().required(),
});

type InferEntityFields<T> = T extends Entity<infer Fields>
   ? {
        [K in keyof Fields]: Fields[K] extends { _type: infer Type; _required: infer Required }
           ? Required extends true
              ? Type
              : Type | undefined
           : never;
     }
   : never;

type Prettify<T> = {
   [K in keyof T]: T[K];
};
export type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};

// from https://github.com/type-challenges/type-challenges/issues/28200
type Merge<T> = {
   [K in keyof T]: T[K];
};
type OptionalUndefined<
   T,
   Props extends keyof T = keyof T,
   OptionsProps extends keyof T = Props extends keyof T
      ? undefined extends T[Props]
         ? Props
         : never
      : never,
> = Merge<
   {
      [K in OptionsProps]?: T[K];
   } & {
      [K in Exclude<keyof T, OptionsProps>]: T[K];
   }
>;

type UserFields = InferEntityFields<typeof user>;
type UserFields2 = Simplify<OptionalUndefined<UserFields>>;

const obj: UserFields2 = { name: "h", age: 1, some: 1 };
