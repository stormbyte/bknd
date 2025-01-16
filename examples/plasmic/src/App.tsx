import { registerAll } from "@bknd/plasmic";
import {
   type ComponentRenderData,
   PlasmicCanvasHost,
   PlasmicComponent,
   type PlasmicComponentLoader,
   PlasmicRootProvider,
   initPlasmicLoader
} from "@plasmicapp/loader-react";
import { Suspense, forwardRef, lazy, useEffect, useState } from "react";
import { Route, Router, Switch } from "wouter";
const Admin = lazy(() => import("./admin"));

export const PLASMIC = initPlasmicLoader({
   projects: [
      {
         id: import.meta.env.VITE_PLASMIC_ID as string,
         token: import.meta.env.VITE_PLASMIC_TOKEN as string
      }
   ],
   // Fetches the latest revisions, whether or not they were unpublished!
   // Disable for production to ensure you render only published changes.
   preview: true
});

registerAll(PLASMIC);

export default function App() {
   return (
      <Router>
         <Switch>
            <Route path="/admin/*?">
               <Suspense>
                  <Admin />
               </Suspense>
            </Route>
            <Route path="/host" component={PlasmicCanvasHost as any} />
            <Route path="/*" component={() => <CatchAllPage PLASMIC={PLASMIC} />} />
         </Switch>
      </Router>
   );
}

const CustomLink = forwardRef<any, any>((props, ref) => {
   //console.log("rendering custom link", props);
   //return null;
   if ("data-replace" in props) {
      return <a ref={ref} {...props} />;
   }
   //return <a ref={ref} {...props} />;
   // @ts-ignore it's because of the link
   return <Link ref={ref} {...props} />;
});

export function CatchAllPage({
   PLASMIC,
   prefix = ""
}: { PLASMIC: PlasmicComponentLoader; prefix?: string }) {
   const [loading, setLoading] = useState(true);
   const [pageData, setPageData] = useState<ComponentRenderData | null>(null);

   const pathname = location.pathname.replace(prefix, "");
   const path = pathname.length === 0 ? "/" : pathname;
   useEffect(() => {
      async function load() {
         const pageData = await PLASMIC.maybeFetchComponentData(path);
         setPageData(pageData);
         setLoading(false);
      }
      load().catch(console.error);
   }, []);

   if (loading) {
      return <>Loading ...</>;
   }
   if (!pageData) {
      return <>Not found</>;
   }

   const pageMeta = pageData.entryCompMetas[0];

   // The page will already be cached from the `load` call above.
   return (
      <PlasmicRootProvider loader={PLASMIC} pageParams={pageMeta.params} Link={CustomLink}>
         <PlasmicComponent component={path} />
      </PlasmicRootProvider>
   );
}
