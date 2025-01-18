import { PreviewWrapperMemoized } from "./Dropzone";
import { DropzoneContainer } from "./DropzoneContainer";

export const Media = {
   Dropzone: DropzoneContainer,
   Preview: PreviewWrapperMemoized
};

export type {
   PreviewComponentProps,
   FileState,
   DropzoneProps,
   DropzoneRenderProps
} from "./Dropzone";
export type { DropzoneContainerProps } from "./DropzoneContainer";
