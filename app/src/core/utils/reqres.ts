import { randomString } from "core/utils/strings";
import type { Context } from "hono";
import { extension, guess, isMimeType } from "media/storage/mime-types-tiny";

export function headersToObject(headers: Headers): Record<string, string> {
   if (!headers) return {};
   return { ...Object.fromEntries(headers.entries()) };
}

export function pickHeaders(headers: Headers, keys: string[]): Record<string, string> {
   const obj = headersToObject(headers);
   const res = {};
   for (const key of keys) {
      if (obj[key]) {
         res[key] = obj[key];
      }
   }
   return res;
}

export const replaceUrlParam = (urlString: string, params: Record<string, string>) => {
   let newString = urlString;
   for (const [k, v] of Object.entries(params)) {
      const reg = new RegExp(`/:${k}(?:{[^/]+})?`);
      newString = newString.replace(reg, `/${v}`);
   }
   return newString;
};

export function encodeSearch(obj, options?: { prefix?: string; encode?: boolean }) {
   let str = "";
   function _encode(str) {
      return options?.encode ? encodeURIComponent(str) : str;
   }

   for (const k in obj) {
      let tmp = obj[k];
      if (tmp !== void 0) {
         if (Array.isArray(tmp)) {
            for (let i = 0; i < tmp.length; i++) {
               if (str.length > 0) str += "&";
               str += `${_encode(k)}=${_encode(tmp[i])}`;
            }
         } else {
            if (typeof tmp === "object") {
               tmp = JSON.stringify(tmp);
            }

            if (str.length > 0) str += "&";
            str += `${_encode(k)}=${_encode(tmp)}`;
         }
      }
   }

   return (options?.prefix || "") + str;
}

export function decodeSearch(str) {
   function toValue(mix) {
      if (!mix) return "";
      const str = decodeURIComponent(mix);
      if (str === "false") return false;
      if (str === "true") return true;
      try {
         return JSON.parse(str);
      } catch (e) {
         return +str * 0 === 0 ? +str : str;
      }
   }

   let tmp: any;
   let k: string;
   const out = {};
   const arr = str.split("&");

   // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
   while ((tmp = arr.shift())) {
      tmp = tmp.split("=");
      k = tmp.shift();
      if (out[k] !== void 0) {
         out[k] = [].concat(out[k], toValue(tmp.shift()));
      } else {
         out[k] = toValue(tmp.shift());
      }
   }

   return out;
}

export function isReadableStream(value: unknown): value is ReadableStream {
   return (
      typeof value === "object" &&
      value !== null &&
      typeof (value as ReadableStream).getReader === "function"
   );
}

export function isBlob(value: unknown): value is Blob {
   return (
      typeof value === "object" &&
      value !== null &&
      typeof (value as Blob).arrayBuffer === "function" &&
      typeof (value as Blob).type === "string"
   );
}

export function isFile(value: unknown): value is File {
   return (
      isBlob(value) &&
      typeof (value as File).name === "string" &&
      typeof (value as File).lastModified === "number"
   );
}

export function isArrayBuffer(value: unknown): value is ArrayBuffer {
   return (
      typeof value === "object" &&
      value !== null &&
      Object.prototype.toString.call(value) === "[object ArrayBuffer]"
   );
}

export function isArrayBufferView(value: unknown): value is ArrayBufferView {
   return typeof value === "object" && value !== null && ArrayBuffer.isView(value);
}

export function getContentName(request: Request): string | undefined;
export function getContentName(contentDisposition: string): string | undefined;
export function getContentName(headers: Headers): string | undefined;
export function getContentName(ctx: Headers | Request | string): string | undefined {
   let c: string = "";

   if (typeof ctx === "string") {
      c = ctx;
   } else if (ctx instanceof Headers) {
      c = ctx.get("Content-Disposition") || "";
   } else if (ctx instanceof Request) {
      c = ctx.headers.get("Content-Disposition") || "";
   }

   const match = c.match(/filename\*?=(?:UTF-8'')?("?)([^";]+)\1/);
   return match ? match[2] : undefined;
}

const FILE_SIGNATURES: Record<string, string> = {
   "89504E47": "image/png",
   FFD8FF: "image/jpeg",
   "47494638": "image/gif",
   "49492A00": "image/tiff", // Little Endian TIFF
   "4D4D002A": "image/tiff", // Big Endian TIFF
   "52494646????57454250": "image/webp", // WEBP (RIFF....WEBP)
   "504B0304": "application/zip",
   "25504446": "application/pdf",
   "00000020667479706D70": "video/mp4",
   "000001BA": "video/mpeg",
   "000001B3": "video/mpeg",
   "1A45DFA3": "video/webm",
   "4F676753": "audio/ogg",
   "494433": "audio/mpeg", // MP3 with ID3 header
   FFF1: "audio/aac",
   FFF9: "audio/aac",
   "52494646????41564920": "audio/wav",
   "52494646????57415645": "audio/wave",
   "52494646????415550": "audio/aiff",
};

async function detectMimeType(
   input: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob | File | null,
): Promise<string | undefined> {
   if (!input) return;

   let buffer: Uint8Array;

   if (isReadableStream(input)) {
      const reader = input.getReader();
      const { value } = await reader.read();
      if (!value) return;
      buffer = new Uint8Array(value);
   } else if (isBlob(input) || isFile(input)) {
      buffer = new Uint8Array(await input.slice(0, 12).arrayBuffer());
   } else if (isArrayBuffer(input)) {
      buffer = new Uint8Array(input);
   } else if (isArrayBufferView(input)) {
      buffer = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
   } else if (typeof input === "string") {
      buffer = new TextEncoder().encode(input);
   } else {
      return;
   }

   const hex = Array.from(buffer.slice(0, 12))
      .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
      .join("");

   for (const [signature, mime] of Object.entries(FILE_SIGNATURES)) {
      const regex = new RegExp("^" + signature.replace(/\?\?/g, ".."));
      if (regex.test(hex)) return mime;
   }

   return;
}

export async function blobToFile(
   blob: Blob | File | unknown,
   overrides: FilePropertyBag & { name?: string } = {},
): Promise<File> {
   if (isFile(blob)) return blob;
   if (!isBlob(blob)) throw new Error("Not a Blob");

   const type = isMimeType(overrides.type, ["application/octet-stream"])
      ? overrides.type
      : await detectMimeType(blob);
   const ext = type ? extension(type) : "";
   const name = overrides.name || [randomString(16), ext].filter(Boolean).join(".");

   return new File([blob], name, {
      type: type || guess(name),
      lastModified: Date.now(),
   });
}

export async function getFileFromContext(c: Context<any>): Promise<File> {
   const contentType = c.req.header("Content-Type") ?? "application/octet-stream";

   if (
      contentType?.startsWith("multipart/form-data") ||
      contentType?.startsWith("application/x-www-form-urlencoded")
   ) {
      try {
         const f = await c.req.formData();
         if ([...f.values()].length > 0) {
            const v = [...f.values()][0];
            return await blobToFile(v);
         }
      } catch (e) {
         console.warn("Error parsing form data", e);
      }
   } else {
      try {
         const blob = await c.req.blob();
         if (isFile(blob)) {
            return blob;
         } else if (isBlob(blob)) {
            return await blobToFile(blob, { name: getContentName(c.req.raw), type: contentType });
         }
      } catch (e) {
         console.warn("Error parsing blob", e);
      }
   }

   throw new Error("No file found in request");
}

export async function getBodyFromContext(c: Context<any>): Promise<ReadableStream | File> {
   const contentType = c.req.header("Content-Type") ?? "application/octet-stream";

   if (
      !contentType?.startsWith("multipart/form-data") &&
      !contentType?.startsWith("application/x-www-form-urlencoded")
   ) {
      const body = c.req.raw.body;
      if (body) {
         return body;
      }
   }

   return getFileFromContext(c);
}

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
// biome-ignore lint/suspicious/noConstEnum: <explanation>
export const enum HttpStatus {
   // Informational responses (100–199)
   CONTINUE = 100,
   SWITCHING_PROTOCOLS = 101,
   PROCESSING = 102,
   EARLY_HINTS = 103,

   // Successful responses (200–299)
   OK = 200,
   CREATED = 201,
   ACCEPTED = 202,
   NON_AUTHORITATIVE_INFORMATION = 203,
   NO_CONTENT = 204,
   RESET_CONTENT = 205,
   PARTIAL_CONTENT = 206,
   MULTI_STATUS = 207,
   ALREADY_REPORTED = 208,
   IM_USED = 226,

   // Redirection messages (300–399)
   MULTIPLE_CHOICES = 300,
   MOVED_PERMANENTLY = 301,
   FOUND = 302,
   SEE_OTHER = 303,
   NOT_MODIFIED = 304,
   USE_PROXY = 305,
   TEMPORARY_REDIRECT = 307,
   PERMANENT_REDIRECT = 308,

   // Client error responses (400–499)
   BAD_REQUEST = 400,
   UNAUTHORIZED = 401,
   PAYMENT_REQUIRED = 402,
   FORBIDDEN = 403,
   NOT_FOUND = 404,
   METHOD_NOT_ALLOWED = 405,
   NOT_ACCEPTABLE = 406,
   PROXY_AUTHENTICATION_REQUIRED = 407,
   REQUEST_TIMEOUT = 408,
   CONFLICT = 409,
   GONE = 410,
   LENGTH_REQUIRED = 411,
   PRECONDITION_FAILED = 412,
   PAYLOAD_TOO_LARGE = 413,
   URI_TOO_LONG = 414,
   UNSUPPORTED_MEDIA_TYPE = 415,
   RANGE_NOT_SATISFIABLE = 416,
   EXPECTATION_FAILED = 417,
   IM_A_TEAPOT = 418,
   MISDIRECTED_REQUEST = 421,
   UNPROCESSABLE_ENTITY = 422,
   LOCKED = 423,
   FAILED_DEPENDENCY = 424,
   TOO_EARLY = 425,
   UPGRADE_REQUIRED = 426,
   PRECONDITION_REQUIRED = 428,
   TOO_MANY_REQUESTS = 429,
   REQUEST_HEADER_FIELDS_TOO_LARGE = 431,
   UNAVAILABLE_FOR_LEGAL_REASONS = 451,

   // Server error responses (500–599)
   INTERNAL_SERVER_ERROR = 500,
   NOT_IMPLEMENTED = 501,
   BAD_GATEWAY = 502,
   SERVICE_UNAVAILABLE = 503,
   GATEWAY_TIMEOUT = 504,
   HTTP_VERSION_NOT_SUPPORTED = 505,
   VARIANT_ALSO_NEGOTIATES = 506,
   INSUFFICIENT_STORAGE = 507,
   LOOP_DETECTED = 508,
   NOT_EXTENDED = 510,
   NETWORK_AUTHENTICATION_REQUIRED = 511,
}
