import {
   type ComponentPropsWithRef,
   type RefObject,
   memo,
   useEffect,
   useRef,
   useState
} from "react";
import { TbDots } from "react-icons/tb";
import { twMerge } from "tailwind-merge";
import { IconButton } from "ui/components/buttons/IconButton";
import { Dropdown } from "ui/components/overlay/Dropdown";
import { type FileWithPath, useDropzone } from "./use-dropzone";

export type FileState = {
   body: FileWithPath | string;
   path: string;
   name: string;
   size: number;
   type: string;
   state: "pending" | "uploading" | "uploaded" | "failed" | "initial" | "deleting";
   progress: number;
};

export type DropzoneRenderProps = {
   wrapperRef: RefObject<HTMLDivElement>;
   inputProps: ComponentPropsWithRef<"input">;
   state: {
      files: FileState[];
      isOver: boolean;
      showPlaceholder: boolean;
   };
   actions: {
      uploadFileProgress: (file: FileState) => Promise<void>;
      deleteFile: (file: FileState) => Promise<void>;
      openFileInput: () => void;
   };
   dropzoneProps: Pick<DropzoneProps, "maxItems" | "placeholder" | "autoUpload">;
};

export type DropzoneProps = {
   getUploadInfo: (file: FileWithPath) => { url: string; headers?: Headers; method?: string };
   handleDelete: (file: FileState) => Promise<boolean>;
   initialItems?: FileState[];
   maxItems?: number;
   autoUpload?: boolean;
   placeholder?: {
      show?: boolean;
      text?: string;
   };
};

export function Dropzone({
   getUploadInfo,
   handleDelete,
   initialItems = [],
   maxItems,
   autoUpload,
   placeholder
}: DropzoneProps) {
   const [files, setFiles] = useState<FileState[]>(initialItems);
   const [uploading, setUploading] = useState<boolean>(false);
   const inputRef = useRef<HTMLInputElement>(null);

   const { isOver, handleFileInputChange, ref } = useDropzone({
      onDropped: (newFiles: FileWithPath[]) => {
         if (maxItems && files.length + newFiles.length > maxItems) {
            alert("Max items reached");
            return;
         }

         console.log("files", newFiles);
         setFiles((prev) => {
            const currentPaths = prev.map((f) => f.path);
            const filteredFiles: FileState[] = newFiles
               .filter((f) => f.path && !currentPaths.includes(f.path))
               .map((f) => ({
                  body: f,
                  path: f.path!,
                  name: f.name,
                  size: f.size,
                  type: f.type,
                  state: "pending",
                  progress: 0
               }));

            return [...prev, ...filteredFiles];
         });

         if (autoUpload) {
            setUploading(true);
         }
      },
      onOver: (items) => {
         if (maxItems && files.length + items.length >= maxItems) {
            // indicate that the drop is not allowed
            return;
         }
      }
      /*onOver: (items) =>
         console.log(
            "onOver",
            items,
            items.map((i) => [i.kind, i.type].join(":"))
         )*/
   });

   useEffect(() => {
      console.log("files updated");
   }, [files]);

   useEffect(() => {
      if (uploading) {
         (async () => {
            const pendingFiles = files.filter((f) => f.state === "pending");
            if (pendingFiles.length === 0) {
               setUploading(false);
               return;
            } else {
               for (const file of pendingFiles) {
                  await uploadFileProgress(file);
               }
            }
         })();
      }
   }, [uploading]);

   function setFileState(path: string, state: FileState["state"], progress?: number) {
      setFiles((prev) =>
         prev.map((f) => {
            //console.log("compare", f.path, path, f.path === path);
            if (f.path === path) {
               return {
                  ...f,
                  state,
                  progress: progress ?? f.progress
               };
            }
            return f;
         })
      );
   }

   function replaceFileState(prevPath: string, newState: Partial<FileState>) {
      setFiles((prev) =>
         prev.map((f) => {
            if (f.path === prevPath) {
               return {
                  ...f,
                  ...newState
               };
            }
            return f;
         })
      );
   }

   function removeFileFromState(path: string) {
      setFiles((prev) => prev.filter((f) => f.path !== path));
   }

   function uploadFileProgress(file: FileState) {
      return new Promise<void>((resolve, reject) => {
         if (!file.body) {
            console.error("File has no body");
            reject();
            return;
         } else if (file.state !== "pending") {
            console.error("File is not pending");
            reject();
            return;
         } else if (file.body instanceof File === false) {
            console.error("File body is not a File instance");
            reject();
            return;
         }

         const { url, headers, method = "POST" } = getUploadInfo(file.body);
         const formData = new FormData();
         formData.append("file", file.body);

         const xhr = new XMLHttpRequest();
         xhr.open(method, url, true);

         if (headers) {
            headers.forEach((value, key) => {
               xhr.setRequestHeader(key, value);
            });
         }

         // Handle progress events
         xhr.upload.addEventListener("progress", (event) => {
            console.log("progress", event.loaded, event.total);
            if (event.lengthComputable) {
               setFileState(file.path, "uploading", event.loaded / event.total);
               const percentComplete = (event.loaded / event.total) * 100;
               console.log(`Progress: ${percentComplete.toFixed(2)}%`);
            } else {
               console.log(
                  "Unable to compute progress information since the total size is unknown"
               );
            }
         });

         xhr.onload = () => {
            console.log("onload", file.path, xhr.status);
            if (xhr.status === 200) {
               //setFileState(file.path, "uploaded", 1);
               console.log("Upload complete");
               try {
                  const response = JSON.parse(xhr.responseText);

                  console.log("Response:", file, response);
                  console.log("New state", response.state);
                  replaceFileState(file.path, {
                     ...response.state,
                     progress: 1,
                     state: "uploaded"
                  });
               } catch (e) {
                  setFileState(file.path, "uploaded", 1);
                  console.error("Error parsing response", e);
               }
               resolve();
            } else {
               setFileState(file.path, "failed", 1);
               console.error("Upload failed with status: ", xhr.status);
               reject();
            }
         };

         xhr.onerror = () => {
            console.error("Error during the upload process.");
         };
         xhr.onloadstart = () => {
            setFileState(file.path, "uploading", 0);
            console.log("loadstart");
         };

         xhr.setRequestHeader("Accept", "application/json");
         xhr.send(formData);
      });
   }

   async function deleteFile(file: FileState) {
      console.log("deleteFile", file);
      switch (file.state) {
         case "uploaded":
         case "initial":
            if (window.confirm("Are you sure you want to delete this file?")) {
               console.log('setting state to "deleting"', file);
               setFileState(file.path, "deleting");
               await handleDelete(file);
               removeFileFromState(file.path);
            }
            break;
      }
   }

   const openFileInput = () => inputRef.current?.click();
   const showPlaceholder = Boolean(
      placeholder?.show === true || !maxItems || (maxItems && files.length < maxItems)
   );

   const Component = DropzoneInner;

   return (
      <Component
         wrapperRef={ref}
         inputProps={{
            ref: inputRef,
            type: "file",
            multiple: !maxItems || maxItems > 1,
            onChange: handleFileInputChange
         }}
         state={{ files, isOver, showPlaceholder }}
         actions={{ uploadFileProgress, deleteFile, openFileInput }}
         dropzoneProps={{ maxItems, placeholder, autoUpload }}
      />
   );
}

const DropzoneInner = ({
   wrapperRef,
   inputProps,
   state: { files, isOver, showPlaceholder },
   actions: { uploadFileProgress, deleteFile, openFileInput },
   dropzoneProps: { placeholder }
}: DropzoneRenderProps) => {
   return (
      <div
         ref={wrapperRef}
         /*data-drag-over={"1"}*/
         data-drag-over={isOver ? "1" : undefined}
         className="dropzone data-[drag-over]:bg-green-200/10 w-full h-full align-start flex flex-col select-none"
      >
         <div className="hidden">
            <input
               {...inputProps}
               /*ref={inputRef}
               type="file"
               multiple={!maxItems || maxItems > 1}
               onChange={handleFileInputChange}*/
            />
         </div>
         <div className="flex flex-1 flex-col">
            <div className="flex flex-row flex-wrap gap-2 md:gap-3">
               {files.map((file, i) => (
                  <Preview
                     key={file.path}
                     file={file}
                     handleUpload={uploadFileProgress}
                     handleDelete={deleteFile}
                  />
               ))}
               {showPlaceholder && (
                  <UploadPlaceholder onClick={openFileInput} text={placeholder?.text} />
               )}
            </div>
         </div>
      </div>
   );
};

const UploadPlaceholder = ({ onClick, text = "Upload files" }) => {
   return (
      <div
         className="w-[49%] aspect-[1/0.9] md:w-60 flex flex-col border-2 border-dashed border-muted relative justify-center items-center text-primary/30 hover:border-primary/30 hover:text-primary/50 hover:cursor-pointer hover:bg-muted/20 transition-colors duration-200"
         onClick={onClick}
      >
         <span className="">{text}</span>
      </div>
   );
};

const Wrapper = ({ file }: { file: FileState }) => {
   if (file.type.startsWith("image/")) {
      return <ImagePreview file={file} />;
   }

   if (file.type.startsWith("video/")) {
      return <VideoPreview file={file} />;
   }

   return <FallbackPreview file={file} />;
};
const WrapperMemoized = memo(Wrapper, (prev, next) => prev.file.path === next.file.path);

type PreviewProps = {
   file: FileState;
   handleUpload: (file: FileState) => Promise<void>;
   handleDelete: (file: FileState) => Promise<void>;
};
const Preview: React.FC<PreviewProps> = ({ file, handleUpload, handleDelete }) => {
   const dropdownItems = [
      ["initial", "uploaded"].includes(file.state) && {
         label: "Delete",
         onClick: () => handleDelete(file)
      },
      ["initial", "pending"].includes(file.state) && {
         label: "Upload",
         onClick: () => handleUpload(file)
      }
   ];

   return (
      <div
         className={twMerge(
            "w-[49%] md:w-60 flex flex-col border border-muted relative",
            file.state === "deleting" && "opacity-70"
         )}
      >
         {/*{file.state}*/}
         <div className="absolute top-2 right-2">
            <Dropdown items={dropdownItems} position="bottom-end">
               <IconButton Icon={TbDots} />
            </Dropdown>
         </div>
         {file.state === "uploading" && (
            <div className="absolute w-full top-0 left-0 right-0 h-1">
               <div
                  className="bg-blue-600 h-1 transition-all duration-75"
                  style={{ width: (file.progress * 100).toFixed(0) + "%" }}
               />
            </div>
         )}
         <div className="flex bg-primary/5 aspect-[1/0.8] overflow-hidden items-center justify-center">
            <WrapperMemoized file={file} />
         </div>
         <div className="flex flex-col px-1.5 py-1">
            <p className="truncate">{file.name}</p>
            <div className="flex flex-row justify-between text-sm font-mono opacity-50 text-nowrap gap-2">
               <span className="truncate">{file.type}</span>
               <span>{(file.size / 1024).toFixed(1)} KB</span>
            </div>
         </div>
      </div>
   );
};

const ImagePreview = ({ file }: { file: FileState }) => {
   const objectUrl = typeof file.body === "string" ? file.body : URL.createObjectURL(file.body);
   return <img className="max-w-full max-h-full" src={objectUrl} />;
};

const VideoPreview = ({ file }: { file: FileState }) => {
   const objectUrl = typeof file.body === "string" ? file.body : URL.createObjectURL(file.body);
   return <video src={objectUrl} />;
};

const FallbackPreview = ({ file }: { file: FileState }) => {
   return <div className="text-xs text-primary/50 text-center">{file.type}</div>;
};
