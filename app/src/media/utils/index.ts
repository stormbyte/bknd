import { randomString } from "core/utils";

export function getExtension(filename: string): string | undefined {
   if (!filename.includes(".")) return;

   const parts = filename.split(".");
   return parts[parts.length - 1];
}

export function getRandomizedFilename(file: File, length?: number): string;
export function getRandomizedFilename(file: string, length?: number): string;
export function getRandomizedFilename(file: File | string, length = 16): string {
   const filename = file instanceof File ? file.name : file;

   if (typeof filename !== "string") {
      console.error("Couldn't extract filename from", file);
      throw new Error("Invalid file name");
   }

   return [randomString(length), getExtension(filename)].filter(Boolean).join(".");
}
