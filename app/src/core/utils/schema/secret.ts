import { s } from "bknd/utils";

export class SecretSchema<O extends s.IStringOptions> extends s.StringSchema<O> {}

export const secret = <O extends s.IStringOptions>(o?: O): SecretSchema<O> & O =>
   new SecretSchema(o) as any;
