import { type BaseModuleApiOptions, ModuleApi, type PrimaryFieldType } from "modules/ModuleApi";
import type { FileWithPath } from "ui/elements/media/file-selector";

export type MediaApiOptions = BaseModuleApiOptions & {};

export class MediaApi extends ModuleApi<MediaApiOptions> {
   protected override getDefaultOptions(): Partial<MediaApiOptions> {
      return {
         basepath: "/api/media"
      };
   }

   getFiles() {
      return this.get(["files"]);
   }

   getFile(filename: string) {
      return this.get(["file", filename]);
   }

   getFileUploadUrl(file: FileWithPath): string {
      return this.getUrl(`/upload/${file.path}`);
   }

   getEntityUploadUrl(entity: string, id: PrimaryFieldType, field: string) {
      return this.getUrl(`/entity/${entity}/${id}/${field}`);
   }

   getUploadHeaders(): Headers {
      return new Headers({
         Authorization: `Bearer ${this.options.token}`
      });
   }

   uploadFile(file: File) {
      const formData = new FormData();
      formData.append("file", file);
      return this.post(["upload"], formData);
   }

   deleteFile(filename: string) {
      return this.delete(["file", filename]);
   }
}
