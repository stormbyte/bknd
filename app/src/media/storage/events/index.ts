import { Event } from "core/events";
import type { FileBody, FileUploadPayload } from "../Storage";

export type FileUploadedEventData = FileUploadPayload & {
   file: FileBody;
};
export class FileUploadedEvent extends Event<FileUploadedEventData> {
   static override slug = "file-uploaded";
}

export class FileDeletedEvent extends Event<{ name: string }> {
   static override slug = "file-deleted";
}

export class FileAccessEvent extends Event<{ name: string }> {
   static override slug = "file-access";
}
