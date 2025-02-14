import { randomString } from "core/utils";

export function getExtension(filename: string): string | undefined {
   if (!filename.includes(".")) return;

   const parts = filename.split(".");
   return parts[parts.length - 1];
}

export function getRandomizedFilename(file: File, length?: number): string;
export function getRandomizedFilename(file: string, length?: number): string;
export function getRandomizedFilename(file: File | string, length = 16): string {
   const filename = typeof file === "string" ? file : file.name;

   if (typeof filename !== "string") {
      console.error("Couldn't extract filename from", file);
      throw new Error("Invalid file name");
   }

   // @todo: use uuid instead?
   return [randomString(length), getExtension(filename)].filter(Boolean).join(".");
}
