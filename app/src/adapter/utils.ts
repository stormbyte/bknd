import type { IncomingMessage } from "node:http";

export function nodeRequestToRequest(req: IncomingMessage): Request {
   let protocol = "http";
   try {
      protocol = req.headers["x-forwarded-proto"] as string;
   } catch (e) {}
   const host = req.headers.host;
   const url = `${protocol}://${host}${req.url}`;
   const headers = new Headers();

   for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) {
         headers.append(key, value.join(", "));
      } else if (value) {
         headers.append(key, value);
      }
   }

   const method = req.method || "GET";
   return new Request(url, {
      method,
      headers,
   });
}
