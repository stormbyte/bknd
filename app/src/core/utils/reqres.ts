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
