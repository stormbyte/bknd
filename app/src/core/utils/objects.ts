import { pascalToKebab } from "./strings";

export function _jsonp(obj: any, space = 2): string {
   return JSON.stringify(obj, null, space);
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
   return Object.prototype.toString.call(value) === "[object Object]";
}

export function isObject(value: unknown): value is Record<string, unknown> {
   return value !== null && typeof value === "object";
}

export function safelyParseObjectValues<T extends { [key: string]: any }>(obj: T): T {
   return Object.entries(obj).reduce((acc, [key, value]) => {
      try {
         // @ts-ignore
         acc[key] = JSON.parse(value);
      } catch (error) {
         // @ts-ignore
         acc[key] = value;
      }
      return acc;
   }, {} as T);
}

export function keepChanged<T extends object>(origin: T, updated: T): Partial<T> {
   return Object.keys(updated).reduce(
      (acc, key) => {
         if (updated[key] !== origin[key]) {
            acc[key] = updated[key];
         }
         return acc;
      },
      {} as Partial<T>
   );
}

export function objectKeysPascalToKebab(obj: any, ignoreKeys: string[] = []): any {
   if (obj === null || typeof obj !== "object") {
      return obj;
   }

   if (Array.isArray(obj)) {
      return obj.map((item) => objectKeysPascalToKebab(item, ignoreKeys));
   }

   return Object.keys(obj).reduce(
      (acc, key) => {
         const kebabKey = ignoreKeys.includes(key) ? key : pascalToKebab(key);
         acc[kebabKey] = objectKeysPascalToKebab(obj[key], ignoreKeys);
         return acc;
      },
      {} as Record<string, any>
   );
}

export function filterKeys<Object extends { [key: string]: any }>(
   obj: Object,
   keysToFilter: string[]
): Object {
   const result = {} as Object;

   for (const key in obj) {
      const shouldFilter = keysToFilter.some((filterKey) => key.includes(filterKey));
      if (!shouldFilter) {
         if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
            result[key] = filterKeys(obj[key], keysToFilter);
         } else {
            result[key] = obj[key];
         }
      }
   }

   return result;
}

export function transformObject<T extends Record<string, any>, U>(
   object: T,
   transform: (value: T[keyof T], key: keyof T) => U | undefined
): { [K in keyof T]: U } {
   return Object.entries(object).reduce(
      (acc, [key, value]) => {
         const t = transform(value, key as keyof T);
         if (typeof t !== "undefined") {
            acc[key as keyof T] = t;
         }
         return acc;
      },
      {} as { [K in keyof T]: U }
   );
}
export const objectTransform = transformObject;

export function objectEach<T extends Record<string, any>, U>(
   object: T,
   each: (value: T[keyof T], key: keyof T) => U
): void {
   Object.entries(object).forEach(
      ([key, value]) => {
         each(value, key);
      },
      {} as { [K in keyof T]: U }
   );
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
export function mergeDeep(target, ...sources) {
   if (!sources.length) return target;
   const source = sources.shift();

   if (isObject(target) && isObject(source)) {
      for (const key in source) {
         if (isObject(source[key])) {
            if (!target[key]) Object.assign(target, { [key]: {} });
            mergeDeep(target[key], source[key]);
         } else {
            Object.assign(target, { [key]: source[key] });
         }
      }
   }

   return mergeDeep(target, ...sources);
}

export function getFullPathKeys(obj: any, parentPath: string = ""): string[] {
   let keys: string[] = [];

   for (const key in obj) {
      const fullPath = parentPath ? `${parentPath}.${key}` : key;
      keys.push(fullPath);

      if (typeof obj[key] === "object" && obj[key] !== null) {
         keys = keys.concat(getFullPathKeys(obj[key], fullPath));
      }
   }

   return keys;
}

export function flattenObject(obj: any, parentKey = "", result: any = {}): any {
   for (const key in obj) {
      if (key in obj) {
         const newKey = parentKey ? `${parentKey}.${key}` : key;
         if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
            flattenObject(obj[key], newKey, result);
         } else if (Array.isArray(obj[key])) {
            obj[key].forEach((item, index) => {
               const arrayKey = `${newKey}.${index}`;
               if (typeof item === "object" && item !== null) {
                  flattenObject(item, arrayKey, result);
               } else {
                  result[arrayKey] = item;
               }
            });
         } else {
            result[newKey] = obj[key];
         }
      }
   }
   return result;
}

export function flattenObject2(obj: any, parentKey = "", result: any = {}): any {
   for (const key in obj) {
      if (key in obj) {
         const newKey = parentKey ? `${parentKey}.${key}` : key;
         if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
            flattenObject2(obj[key], newKey, result);
         } else if (Array.isArray(obj[key])) {
            obj[key].forEach((item, index) => {
               const arrayKey = `${newKey}[${index}]`;
               if (typeof item === "object" && item !== null) {
                  flattenObject2(item, arrayKey, result);
               } else {
                  result[arrayKey] = item;
               }
            });
         } else {
            result[newKey] = obj[key];
         }
      }
   }
   return result;
}

export function objectDepth(object: object): number {
   let level = 1;
   for (const key in object) {
      if (typeof object[key] === "object") {
         const depth = objectDepth(object[key]) + 1;
         level = Math.max(depth, level);
      }
   }
   return level;
}

export function objectCleanEmpty<Obj extends { [key: string]: any }>(obj: Obj): Obj {
   if (!obj) return obj;
   return Object.entries(obj).reduce((acc, [key, value]) => {
      if (value && Array.isArray(value) && value.some((v) => typeof v === "object")) {
         const nested = value.map(objectCleanEmpty);
         if (nested.length > 0) {
            acc[key] = nested;
         }
      } else if (value && typeof value === "object" && !Array.isArray(value)) {
         const nested = objectCleanEmpty(value);
         if (Object.keys(nested).length > 0) {
            acc[key] = nested;
         }
      } else if (value !== "" && value !== null && value !== undefined) {
         acc[key] = value;
      }
      return acc;
   }, {} as any);
}

/**
 * Lodash's merge implementation caused issues in Next.js environments
 * From: https://thescottyjam.github.io/snap.js/#!/nolodash/merge
 * NOTE: This mutates `object`. It also may mutate anything that gets attached to `object` during the merge.
 * @param object
 * @param sources
 */
export function mergeObject(object, ...sources) {
   for (const source of sources) {
      for (const [key, value] of Object.entries(source)) {
         if (value === undefined) {
            continue;
         }

         // These checks are a week attempt at mimicking the various edge-case behaviors
         // that Lodash's `_.merge()` exhibits. Feel free to simplify and
         // remove checks that you don't need.
         if (!isPlainObject(value) && !Array.isArray(value)) {
            object[key] = value;
         } else if (Array.isArray(value) && !Array.isArray(object[key])) {
            object[key] = value;
         } else if (!isObject(object[key])) {
            object[key] = value;
         } else {
            mergeObject(object[key], value);
         }
      }
   }

   return object;
}

/**
 * Lodash's mergeWith implementation caused issues in Next.js environments
 * From: https://thescottyjam.github.io/snap.js/#!/nolodash/mergeWith
 * NOTE: This mutates `object`. It also may mutate anything that gets attached to `object` during the merge.
 * @param object
 * @param sources
 * @param customizer
 */
export function mergeObjectWith(object, source, customizer) {
   for (const [key, value] of Object.entries(source)) {
      const mergedValue = customizer(object[key], value, key, object, source);
      if (mergedValue !== undefined) {
         object[key] = mergedValue;
         continue;
      }
      // Otherwise, fall back to default behavior

      if (value === undefined) {
         continue;
      }

      // These checks are a week attempt at mimicking the various edge-case behaviors
      // that Lodash's `_.merge()` exhibits. Feel free to simplify and
      // remove checks that you don't need.
      if (!isPlainObject(value) && !Array.isArray(value)) {
         object[key] = value;
      } else if (Array.isArray(value) && !Array.isArray(object[key])) {
         object[key] = value;
      } else if (!isObject(object[key])) {
         object[key] = value;
      } else {
         mergeObjectWith(object[key], value, customizer);
      }
   }

   return object;
}
