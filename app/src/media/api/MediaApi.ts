import { type BaseModuleApiOptions, ModuleApi, type PrimaryFieldType } from "modules/ModuleApi";
import type { FileWithPath } from "ui/modules/media/components/dropzone/file-selector";

export type MediaApiOptions = BaseModuleApiOptions & {};

export class MediaApi extends ModuleApi<MediaApiOptions> {
   protected override getDefaultOptions(): Partial<MediaApiOptions> {
      return {
         basepath: "/api/media"
      };
   }

   async getFiles() {
      return this.get(["files"]);
   }

   async getFile(filename: string) {
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

   async uploadFile(file: File) {
      const formData = new FormData();
      formData.append("file", file);
      return this.post(["upload"], formData);
   }

   async deleteFile(filename: string) {
      return this.delete(["file", filename]);
   }
}
