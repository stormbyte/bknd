import { PLASMIC } from "@/plasmic-init";
import {
   type ComponentRenderData,
   PlasmicComponent,
   PlasmicRootProvider,
   extractPlasmicQueryData
} from "@plasmicapp/loader-nextjs";
import type { GetServerSideProps } from "next";
// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
import Error from "next/error";
import { useRouter } from "next/router";
import * as React from "react";

export const getServerSideProps: GetServerSideProps = async (context) => {
   const { catchall } = context.params ?? {};

   // Convert the catchall param into a path string
   const plasmicPath =
      typeof catchall === "string"
         ? catchall
         : Array.isArray(catchall)
           ? `/${catchall.join("/")}`
           : "/";
   const plasmicData = await PLASMIC.maybeFetchComponentData(plasmicPath);
   if (!plasmicData) {
      // This is some non-Plasmic catch-all page
      return {
         props: {}
      };
   }

   // This is a path that Plasmic knows about.
   const pageMeta = plasmicData.entryCompMetas[0];

   // Cache the necessary data fetched for the page.
   const queryCache = await extractPlasmicQueryData(
      <PlasmicRootProvider
         loader={PLASMIC}
         prefetchedData={plasmicData}
         pageRoute={pageMeta.path}
         pageParams={pageMeta.params}
      >
         {/* @ts-ignore */}
         <PlasmicComponent component={pageMeta.displayName} />
      </PlasmicRootProvider>
   );

   // Pass the data in as props.
   return {
      props: { plasmicData, queryCache }
   };
};

export default function CatchallPage(props: {
   plasmicData?: ComponentRenderData;
   queryCache?: Record<string, any>;
}) {
   const { plasmicData, queryCache } = props;
   const router = useRouter();
   if (!plasmicData || plasmicData.entryCompMetas.length === 0) {
      return <Error statusCode={404} />;
   }
   const pageMeta = plasmicData.entryCompMetas[0];
   return (
      // Pass in the data fetched in getStaticProps as prefetchedData
      <PlasmicRootProvider
         loader={PLASMIC}
         prefetchedData={plasmicData}
         prefetchedQueryData={queryCache}
         pageRoute={pageMeta.path}
         pageParams={pageMeta.params}
         pageQuery={router.query}
      >
         {/* @ts-ignore */}
         <PlasmicComponent component={pageMeta.displayName} />
      </PlasmicRootProvider>
   );
}
