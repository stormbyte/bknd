import type { RepoQuery } from "data";
import type { MediaFieldSchema } from "media/AppMedia";
import type { TAppMediaConfig } from "media/media-schema";
import { useId } from "react";
import { useApi, useBaseUrl, useEntityQuery, useInvalidate } from "ui/client";
import { useEvent } from "ui/hooks/use-event";
import {
   Dropzone,
   type DropzoneProps,
   type DropzoneRenderProps,
   type FileState
} from "ui/modules/media/components/dropzone/Dropzone";
import { mediaItemsToFileStates } from "ui/modules/media/helper";

export type DropzoneContainerProps = {
   children?: (props: DropzoneRenderProps) => JSX.Element;
   initialItems?: MediaFieldSchema[];
   entity?: {
      name: string;
      id: number;
      field: string;
   };
   query?: Partial<RepoQuery>;
} & Partial<Pick<TAppMediaConfig, "basepath" | "entity_name" | "storage">> &
   Partial<DropzoneProps>;

export function DropzoneContainer({
   initialItems,
   basepath = "/api/media",
   storage = {},
   entity_name = "media",
   entity,
   query,
   ...props
}: DropzoneContainerProps) {
   const id = useId();
   const baseUrl = useBaseUrl();
   const api = useApi();
   const invalidate = useInvalidate();
   const limit = query?.limit ? query?.limit : props.maxItems ? props.maxItems : 50;

   const $q = useEntityQuery(
      entity_name as "media",
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
      />
   );
}
