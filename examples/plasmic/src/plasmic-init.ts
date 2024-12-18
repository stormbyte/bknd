import { initPlasmicLoader } from "@plasmicapp/loader-nextjs";
import { loader } from "@bknd/plasmic";

export const PLASMIC = initPlasmicLoader({
   projects: [
      {
         id: process.env.PLASMIC_ID!,
         token: process.env.PLASMIC_TOKEN!,
      }
   ],
   preview: true, //process.env.NODE_ENV === "development",
})

loader(PLASMIC);
/*
PLASMIC.registerComponent(BkndData, BkndDataMeta);
PLASMIC.registerGlobalContext(BkndContext, BkndContextMeta as any);*/
