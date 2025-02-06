import type { TAppMediaConfig } from "media/media-schema";
import { useBknd } from "ui/client/BkndProvider";

export function useBkndMedia() {
   const { config, schema, actions: bkndActions } = useBknd();

   const actions = {
      config: {
         patch: async (data: Partial<TAppMediaConfig>) => {
            return await bkndActions.set("media", data, true);
         }
      }
   };
   const $media = {};

   return {
      $media,
      config: config.media,
      schema: schema.media,
      actions
   };
}
