export type Prettify<T> = {
   [K in keyof T]: T[K];
} & NonNullable<unknown>;

// prettify recursively
export type PrettifyRec<T> = {
   [K in keyof T]: T[K] extends object ? Prettify<T[K]> : T[K];
} & NonNullable<unknown>;
