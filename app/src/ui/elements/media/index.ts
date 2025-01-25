import { PreviewWrapperMemoized } from "./Dropzone";
import { DropzoneContainer, useDropzone } from "./DropzoneContainer";

export const Media = {
   Dropzone: DropzoneContainer,
   Preview: PreviewWrapperMemoized,
   useDropzone: useDropzone
};

export { useDropzone as useMediaDropzone };

export type {
   PreviewComponentProps,
   FileState,
   DropzoneProps,
   DropzoneRenderProps
} from "./Dropzone";
export type { DropzoneContainerProps } from "./DropzoneContainer";
