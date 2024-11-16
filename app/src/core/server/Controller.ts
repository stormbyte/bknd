import { Hono, type MiddlewareHandler, type ValidationTargets } from "hono";
import type { H } from "hono/types";
import { safelyParseObjectValues } from "../utils";
import type { Endpoint, Middleware } from "./Endpoint";
import { zValidator } from "./lib/zValidator";

type RouteProxy<Endpoints> = {
   [K in keyof Endpoints]: Endpoints[K];
};

export interface ClassController {
   getController: () => Hono<any, any, any>;
   getMiddleware?: MiddlewareHandler<any, any, any>;
}

/**
 * @deprecated
 */
export class Controller<
   Endpoints extends Record<string, Endpoint> = Record<string, Endpoint>,
   Middlewares extends Record<string, Middleware> = Record<string, Middleware>
> {
   protected endpoints: Endpoints = {} as Endpoints;
   protected middlewares: Middlewares = {} as Middlewares;

   public prefix: string = "/";
   public routes: RouteProxy<Endpoints>;

   constructor(
      prefix: string = "/",
      endpoints: Endpoints = {} as Endpoints,
      middlewares: Middlewares = {} as Middlewares
   ) {
      this.prefix = prefix;
      this.endpoints = endpoints;
      this.middlewares = middlewares;

      this.routes = new Proxy(
         {},
         {
            get: (_, name: string) => {
               return this.endpoints[name];
            }
         }
      ) as RouteProxy<Endpoints>;
   }

   add<Name extends string, E extends Endpoint>(
      this: Controller<Endpoints>,
      name: Name,
      endpoint: E
   ): Controller<Endpoints & Record<Name, E>> {
      const newEndpoints = {
         ...this.endpoints,
         [name]: endpoint
      } as Endpoints & Record<Name, E>;
      const newController: Controller<Endpoints & Record<Name, E>> = new Controller<
         Endpoints & Record<Name, E>
      >();
      newController.endpoints = newEndpoints;
      newController.middlewares = this.middlewares;
      return newController;
   }

   get<Name extends keyof Endpoints>(name: Name): Endpoints[Name] {
      return this.endpoints[name];
   }

   honoify(_hono: Hono = new Hono()) {
      const hono = _hono.basePath(this.prefix);

      // apply middlewares
      for (const m_name in this.middlewares) {
         const middleware = this.middlewares[m_name];

         if (typeof middleware === "function") {
            //if (isDebug()) console.log("+++ appyling middleware", m_name, middleware);
            hono.use(middleware);
         }
      }

      // apply endpoints
      for (const name in this.endpoints) {
         const endpoint = this.endpoints[name];
         if (!endpoint) continue;

         const handlers: H[] = [];

         const supportedValidations: Array<keyof ValidationTargets> = ["param", "query", "json"];

         // if validations are present, add them to the handlers
         for (const validation of supportedValidations) {
            if (endpoint.validation[validation]) {
               handlers.push(async (c, next) => {
                  // @todo: potentially add "strict" to all schemas?
                  const res = await zValidator(
                     validation,
                     endpoint.validation[validation] as any,
                     (target, value, c) => {
                        if (["query", "param"].includes(target)) {
                           return safelyParseObjectValues(value);
                        }
                        //console.log("preprocess", target, value, c.req.raw.url);
                        return value;
                     }
                  )(c, next);

                  if (res instanceof Response && res.status === 400) {
                     const error = await res.json();
                     return c.json(
                        {
                           error: "Validation error",
                           target: validation,
                           message: error
                        },
                        400
                     );
                  }

                  return res;
               });
            }
         }

         // add actual handler
         handlers.push(endpoint.toHandler());

         const method = endpoint.method.toLowerCase() as
            | "get"
            | "post"
            | "put"
            | "delete"
            | "patch";

         //if (isDebug()) console.log("--- adding", method, endpoint.path);
         hono[method](endpoint.path, ...handlers);
      }

      return hono;
   }

   toJSON() {
      const endpoints: any = {};
      for (const name in this.endpoints) {
         const endpoint = this.endpoints[name];
         if (!endpoint) continue;

         endpoints[name] = {
            method: endpoint.method,
            path: (this.prefix + endpoint.path).replace("//", "/")
         };
      }
      return endpoints;
   }
}
