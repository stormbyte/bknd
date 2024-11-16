import type { Context } from "hono";

export class ContextHelper {
   constructor(protected c: Context) {}

   contentTypeMime(): string {
      const contentType = this.c.res.headers.get("Content-Type");
      if (contentType) {
         return String(contentType.split(";")[0]);
      }
      return "";
   }

   isHtml(): boolean {
      return this.contentTypeMime() === "text/html";
   }

   url(): URL {
      return new URL(this.c.req.url);
   }

   headersObject() {
      const headers = {};
      for (const [k, v] of this.c.res.headers.entries()) {
         headers[k] = v;
      }
      return headers;
   }
}
