import { Event, InvalidEventReturn } from "core/events";
import type { FileBody, FileUploadPayload } from "../Storage";

export type FileUploadedEventData = FileUploadPayload & {
   file: FileBody;
};
export class FileUploadedEvent extends Event<FileUploadedEventData, object> {
   static override slug = "file-uploaded";

   override validate(data: object) {
      if (typeof data !== "object") {
         throw new InvalidEventReturn("object", typeof data);
      }

      return this.clone({
         // prepending result, so original is always kept
         ...data,
         ...this.params,
      });
   }
}

export class FileDeletedEvent extends Event<{ name: string }> {
   static override slug = "file-deleted";
}

export class FileAccessEvent extends Event<{ name: string }> {
   static override slug = "file-access";
}
