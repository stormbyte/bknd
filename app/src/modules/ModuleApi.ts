import type { PrimaryFieldType } from "core";
import { encodeSearch } from "core/utils";

export type { PrimaryFieldType };
export type BaseModuleApiOptions = {
   host: string;
   basepath?: string;
   token?: string;
};

export type ApiResponse<Data = any> = {
   success: boolean;
   status: number;
   body: Data;
   data?: Data extends { data: infer R } ? R : any;
   res: Response;
};

export abstract class ModuleApi<Options extends BaseModuleApiOptions> {
   constructor(protected readonly _options: Partial<Options> = {}) {}

   protected getDefaultOptions(): Partial<Options> {
      return {};
   }

   get options(): Options {
      return {
         host: "http://localhost",
         token: undefined,
         ...this.getDefaultOptions(),
         ...this._options
      } as Options;
   }

   protected getUrl(path: string) {
      return this.options.host + (this.options.basepath + "/" + path).replace(/\/\//g, "/");
   }

   protected async request<Data = any>(
      _input: string | (string | number | PrimaryFieldType)[],
      _query?: Record<string, any> | URLSearchParams,
      _init?: RequestInit
   ): Promise<ApiResponse<Data>> {
      const method = _init?.method ?? "GET";
      const input = Array.isArray(_input) ? _input.join("/") : _input;
      let url = this.getUrl(input);

      if (_query instanceof URLSearchParams) {
         url += "?" + _query.toString();
      } else if (typeof _query === "object") {
         if (Object.keys(_query).length > 0) {
            url += "?" + encodeSearch(_query);
         }
      }

      const headers = new Headers(_init?.headers ?? {});
      headers.set("Accept", "application/json");

      if (this.options.token) {
         //console.log("setting token", this.options.token);
         headers.set("Authorization", `Bearer ${this.options.token}`);
      } else {
         //console.log("no token");
      }

      let body: any = _init?.body;
      if (_init && "body" in _init && ["POST", "PATCH"].includes(method)) {
         const requestContentType = (headers.get("Content-Type") as string) ?? undefined;
         if (!requestContentType || requestContentType.startsWith("application/json")) {
            body = JSON.stringify(_init.body);
            headers.set("Content-Type", "application/json");
         }
      }

      //console.log("url", url);
      const res = await fetch(url, {
         ..._init,
         method,
         body,
         headers
      });

      let resBody: any;
      let resData: any;

      const contentType = res.headers.get("Content-Type") ?? "";
      if (contentType.startsWith("application/json")) {
         resBody = await res.json();
         if (typeof resBody === "object") {
            resData = "data" in resBody ? resBody.data : resBody;
         }
      } else if (contentType.startsWith("text")) {
         resBody = await res.text();
      }

      return {
         success: res.ok,
         status: res.status,
         body: resBody,
         data: resData,
         res
      };
   }

   protected async get<Data = any>(
      _input: string | (string | number | PrimaryFieldType)[],
      _query?: Record<string, any> | URLSearchParams,
      _init?: RequestInit
   ) {
      return this.request<Data>(_input, _query, {
         ..._init,
         method: "GET"
      });
   }

   protected async post<Data = any>(
      _input: string | (string | number | PrimaryFieldType)[],
      body?: any,
      _init?: RequestInit
   ) {
      return this.request<Data>(_input, undefined, {
         ..._init,
         body,
         method: "POST"
      });
   }

   protected async patch<Data = any>(
      _input: string | (string | number | PrimaryFieldType)[],
      body?: any,
      _init?: RequestInit
   ) {
      return this.request<Data>(_input, undefined, {
         ..._init,
         body,
         method: "PATCH"
      });
   }

   protected async delete<Data = any>(
      _input: string | (string | number | PrimaryFieldType)[],
      _init?: RequestInit
   ) {
      return this.request<Data>(_input, undefined, {
         ..._init,
         method: "DELETE"
      });
   }
}
