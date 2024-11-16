export function objectToKeyValueArray<T extends Record<string, any>>(obj: T) {
   return Object.keys(obj).map((key) => ({ key, value: obj[key as keyof T] }));
}

export function ucFirst(str: string): string {
   if (!str || str.length === 0) return str;
   return str.charAt(0).toUpperCase() + str.slice(1);
}

export function ucFirstAll(str: string, split: string = " "): string {
   if (!str || str.length === 0) return str;
   return str
      .split(split)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(split);
}

export function ucFirstAllSnakeToPascalWithSpaces(str: string, split: string = " "): string {
   return ucFirstAll(snakeToPascalWithSpaces(str), split);
}

export function randomString(length: number, includeSpecial = false): string {
   const base = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
   const special = "!@#$%^&*()_+{}:\"<>?|[];',./`~";
   const chars = base + (includeSpecial ? special : "");
   let result = "";
   for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
   }
   return result;
}

/**
 * Convert a string from snake_case to PascalCase with spaces
 * Example: `snake_to_pascal` -> `Snake To Pascal`
 *
 * @param str
 */
export function snakeToPascalWithSpaces(str: string): string {
   if (!str || str.length === 0) return str;

   return str
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
}

export function pascalToKebab(pascalStr: string): string {
   return pascalStr.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Replace simple mustache like {placeholders} in a string
 *
 * @param str
 * @param vars
 */
export function replaceSimplePlaceholders(str: string, vars: Record<string, any>): string {
   return str.replace(/\{\$(\w+)\}/g, (match, key) => {
      return key in vars ? vars[key] : match;
   });
}
