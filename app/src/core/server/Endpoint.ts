import type { Context, MiddlewareHandler, Next, ValidationTargets } from "hono";
import type { Handler } from "hono/types";
import { encodeSearch, replaceUrlParam } from "../utils";
import type { Prettify } from "../utils";

type ZodSchema = { [key: string]: any };

type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type Validation<P, Q, B> = {
   [K in keyof ValidationTargets]?: any;
} & {
   param?: P extends ZodSchema ? P : undefined;
   query?: Q extends ZodSchema ? Q : undefined;
   json?: B extends ZodSchema ? B : undefined;
};

type ValidationInput<P, Q, B> = {
   param?: P extends ZodSchema ? P["_input"] : undefined;
   query?: Q extends ZodSchema ? Q["_input"] : undefined;
   json?: B extends ZodSchema ? B["_input"] : undefined;
};

type HonoEnv = any;

export type Middleware = MiddlewareHandler<any, any, any>;

type HandlerFunction<P extends string, R> = (c: Context<HonoEnv, P, any>, next: Next) => R;
export type RequestResponse<R> = {
   status: number;
   ok: boolean;
   response: Awaited<R>;
};

/**
 * @deprecated
 */
export class Endpoint<
   Path extends string = any,
   P extends ZodSchema = any,
   Q extends ZodSchema = any,
   B extends ZodSchema = any,
   R = any
> {
   constructor(
      readonly method: Method,
      readonly path: Path,
      readonly handler: HandlerFunction<Path, R>,
      readonly validation: Validation<P, Q, B> = {}
   ) {}

   // @todo: typing is not ideal
   async $request(
      args?: ValidationInput<P, Q, B>,
      baseUrl: string = "http://localhost:28623"
   ): Promise<Prettify<RequestResponse<R>>> {
      let path = this.path as string;
      if (args?.param) {
         path = replaceUrlParam(path, args.param);
      }

      if (args?.query) {
         path += "?" + encodeSearch(args.query);
      }

      const url = [baseUrl, path].join("").replace(/\/$/, "");
      const options: RequestInit = {
         method: this.method,
         headers: {} as any
      };

      if (!["GET", "HEAD"].includes(this.method)) {
         if (args?.json) {
            options.body = JSON.stringify(args.json);
            options.headers!["Content-Type"] = "application/json";
         }
      }

      const res = await fetch(url, options);
      return {
         status: res.status,
         ok: res.ok,
         response: (await res.json()) as any
      };
   }

   toHandler(): Handler {
      return async (c, next) => {
         const res = await this.handler(c, next);
         //console.log("toHandler:isResponse", res instanceof Response);
         //return res;
         if (res instanceof Response) {
            return res;
         }
         return c.json(res as any) as unknown as Handler;
      };
   }

   static get<
      Path extends string = any,
      P extends ZodSchema = any,
      Q extends ZodSchema = any,
      B extends ZodSchema = any,
      R = any
   >(path: Path, handler: HandlerFunction<Path, R>, validation?: Validation<P, Q, B>) {
      return new Endpoint<Path, P, Q, B, R>("GET", path, handler, validation);
   }

   static post<
      Path extends string = any,
      P extends ZodSchema = any,
      Q extends ZodSchema = any,
      B extends ZodSchema = any,
      R = any
   >(path: Path, handler: HandlerFunction<Path, R>, validation?: Validation<P, Q, B>) {
      return new Endpoint<Path, P, Q, B, R>("POST", path, handler, validation);
   }

   static patch<
      Path extends string = any,
      P extends ZodSchema = any,
      Q extends ZodSchema = any,
      B extends ZodSchema = any,
      R = any
   >(path: Path, handler: HandlerFunction<Path, R>, validation?: Validation<P, Q, B>) {
      return new Endpoint<Path, P, Q, B, R>("PATCH", path, handler, validation);
   }

   static put<
      Path extends string = any,
      P extends ZodSchema = any,
      Q extends ZodSchema = any,
      B extends ZodSchema = any,
      R = any
   >(path: Path, handler: HandlerFunction<Path, R>, validation?: Validation<P, Q, B>) {
      return new Endpoint<Path, P, Q, B, R>("PUT", path, handler, validation);
   }

   static delete<
      Path extends string = any,
      P extends ZodSchema = any,
      Q extends ZodSchema = any,
      B extends ZodSchema = any,
      R = any
   >(path: Path, handler: HandlerFunction<Path, R>, validation?: Validation<P, Q, B>) {
      return new Endpoint<Path, P, Q, B, R>("DELETE", path, handler, validation);
   }
}
