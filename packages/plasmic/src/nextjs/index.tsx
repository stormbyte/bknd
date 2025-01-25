import {
   type ComponentRenderData,
   type NextJsPlasmicComponentLoader,
   PlasmicComponent,
   PlasmicRootProvider,
   extractPlasmicQueryData
} from "@plasmicapp/loader-nextjs";
import type { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from "next";
import NextjsError from "next/error";
import { useRouter } from "next/router";
import React from "react";

type TPlasmic = NextJsPlasmicComponentLoader;
export type TGetStaticPropsOptions = {
   baseUrl?: string;
   revalidate?: number | boolean;
};

export function plasmicNextjsStatic(PLASMIC: TPlasmic, opts?: TGetStaticPropsOptions) {
   return {
      getStaticPaths: getStaticPaths(PLASMIC),
      getStaticProps: getStaticProps(PLASMIC, opts),
      CatchallPage: CatchallPage(PLASMIC)
   };
}

export function getStaticPaths(PLASMIC: TPlasmic): GetStaticPaths {
   return async () => {
      const pages = await PLASMIC.fetchPages();
      return {
         paths: pages.map((page) => ({
            params: { catchall: page.path.substring(1).split("/") }
         })),
         fallback: "blocking"
      };
   };
}

export function getStaticProps(PLASMIC: TPlasmic, opts?: TGetStaticPropsOptions): GetStaticProps {
   return async (context: GetStaticPropsContext) => {
      const baseUrl = opts?.baseUrl ?? process.env.BASE_URL!;

      let { catchall } = context.params ?? {};
      if (catchall && Array.isArray(catchall) && catchall[0] === "index") {
         console.log("setting catch all to undefined");
         catchall = undefined;
      }

      const globalContextsProps = {
         bkndContextProps: {
            baseUrl
         }
      };

      // Convert the catchall param into a path string
      const plasmicPath =
         typeof catchall === "string"
            ? catchall
            : catchall !== null && Array.isArray(catchall)
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
            globalContextsProps={globalContextsProps}
         >
            <PlasmicComponent component={pageMeta.displayName} />
         </PlasmicRootProvider>
      );

      const props = { plasmicData, queryCache, globalContextsProps };

      // Pass the data in as props.
      return {
         props,
         // Using incremental static regeneration, will invalidate this page
         // after 300s (no deploy webhooks needed)
         revalidate: opts?.revalidate ?? 300
      };
   };
}

export function CatchallPage(PLASMIC: TPlasmic) {
   return (props: {
      plasmicData?: ComponentRenderData;
      queryCache?: Record<string, any>;
      globalContextsProps?: any;
   }) => {
      const { plasmicData, queryCache, globalContextsProps } = props;
      const router = useRouter();
      if (!plasmicData || plasmicData.entryCompMetas.length === 0) {
         return <NextjsError statusCode={404} />;
      }
      const pageMeta = plasmicData.entryCompMetas[0];
      return (
         <PlasmicRootProvider
            loader={PLASMIC}
            prefetchedData={plasmicData}
            prefetchedQueryData={queryCache}
            pageRoute={pageMeta.path}
            pageParams={pageMeta.params}
            pageQuery={router.query}
            globalContextsProps={globalContextsProps}
         >
            <PlasmicComponent component={pageMeta.displayName} />
         </PlasmicRootProvider>
      );
   };
}
