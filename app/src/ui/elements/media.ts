import { PreviewWrapperMemoized } from "ui/modules/media/components/dropzone/Dropzone";
import { DropzoneContainer } from "ui/modules/media/components/dropzone/DropzoneContainer";

export const Media = {
   Dropzone: DropzoneContainer,
   Preview: PreviewWrapperMemoized
};

export type {
   PreviewComponentProps,
   FileState,
   DropzoneProps,
   DropzoneRenderProps
} from "ui/modules/media/components/dropzone/Dropzone";
export type { DropzoneContainerProps } from "ui/modules/media/components/dropzone/DropzoneContainer";
