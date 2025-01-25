import type { RepoQueryIn } from "data";
import type { MediaFieldSchema } from "media/AppMedia";
import type { TAppMediaConfig } from "media/media-schema";
import { type ReactNode, createContext, useContext, useId } from "react";
import { useApi, useEntityQuery, useInvalidate } from "ui/client";
import { useEvent } from "ui/hooks/use-event";
import { Dropzone, type DropzoneProps, type DropzoneRenderProps, type FileState } from "./Dropzone";
import { mediaItemsToFileStates } from "./helper";

export type DropzoneContainerProps = {
   children?: ReactNode;
   initialItems?: MediaFieldSchema[];
   entity?: {
      name: string;
      id: number;
      field: string;
   };
   media?: Pick<TAppMediaConfig, "entity_name" | "storage">;
   query?: RepoQueryIn;
} & Omit<Partial<DropzoneProps>, "children" | "initialItems">;

const DropzoneContainerContext = createContext<DropzoneRenderProps>(undefined!);

export function DropzoneContainer({
   initialItems,
   media,
   entity,
   query,
   children,
   ...props
}: DropzoneContainerProps) {
   const id = useId();
   const api = useApi();
   const baseUrl = api.baseUrl;
   const invalidate = useInvalidate();
   const limit = query?.limit ? query?.limit : props.maxItems ? props.maxItems : 50;
   const entity_name = (media?.entity_name ?? "media") as "media";
   //console.log("dropzone:baseUrl", baseUrl);

   const $q = useEntityQuery(
      entity_name,
      undefined,
      {
         ...query,
         limit,
         where: entity
            ? {
                 reference: `${entity.name}.${entity.field}`,
                 entity_id: entity.id,
                 ...query?.where
              }
            : query?.where
      },
      { enabled: !initialItems }
   );

   const getUploadInfo = useEvent((file) => {
      const url = entity
         ? api.media.getEntityUploadUrl(entity.name, entity.id, entity.field)
         : api.media.getFileUploadUrl(file);

      return {
         url,
         headers: api.media.getUploadHeaders(),
         method: "POST"
      };
   });

   const refresh = useEvent(async () => {
      if (entity) {
         invalidate((api) => api.data.readOne(entity.name, entity.id));
      }
      await $q.mutate();
   });

   const handleDelete = useEvent(async (file: FileState) => {
      return api.media.deleteFile(file.path);
   });

   const actualItems = initialItems ?? (($q.data || []) as MediaFieldSchema[]);
   const _initialItems = mediaItemsToFileStates(actualItems, { baseUrl });

   const key = id + JSON.stringify(_initialItems);
   return (
      <Dropzone
         key={id + key}
         getUploadInfo={getUploadInfo}
         handleDelete={handleDelete}
         onUploaded={refresh}
         onDeleted={refresh}
         autoUpload
         initialItems={_initialItems}
         {...props}
      >
         {children
            ? (props) => (
                 <DropzoneContainerContext.Provider value={props}>
                    {children}
                 </DropzoneContainerContext.Provider>
              )
            : undefined}
      </Dropzone>
   );
}

export function useDropzone() {
   return useContext(DropzoneContainerContext);
}
