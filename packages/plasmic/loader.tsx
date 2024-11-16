import { PlasmicCanvasHost, type registerComponent } from "@plasmicapp/host";
import {
   type ComponentRenderData,
   PlasmicComponent,
   type PlasmicComponentLoader,
   PlasmicRootProvider
} from "@plasmicapp/loader-react";
import { forwardRef, useEffect, useState } from "react";
import { Link, Route, Router, Switch } from "wouter";
import {
   BkndData,
   BkndDataMeta,
   Image,
   ImageMeta,
   LazyRender,
   LazyRenderMeta,
   WouterLink,
   WouterLinkMeta
} from "./components";
import { BkndContext, BkndContextMeta } from "./contexts";

export function loader(PLASMIC: PlasmicComponentLoader) {
   PLASMIC.registerComponent(BkndData, BkndDataMeta);
   PLASMIC.registerComponent(WouterLink, WouterLinkMeta);
   PLASMIC.registerComponent(Image, ImageMeta);
   PLASMIC.registerComponent(LazyRender, LazyRenderMeta);
   PLASMIC.registerGlobalContext(BkndContext, BkndContextMeta as any);
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

const Wrapper = ({ children }) => {
   return (
      <div
         style={{
            width: "100wh",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
         }}
      >
         <div style={{ opacity: 0.5, textTransform: "uppercase" }}>{children}</div>
      </div>
   );
};

export function CatchAllPage({
   PLASMIC,
   prefix = ""
}: { PLASMIC: PlasmicComponentLoader; prefix?: string }) {
   const [loading, setLoading] = useState(true);
   const [pageData, setPageData] = useState<ComponentRenderData | null>(null);

   //const params = useParams();
   const pathname = location.pathname.replace(prefix, "");
   const path = pathname.length === 0 ? "/" : pathname;
   //console.log("path", path, params);
   useEffect(() => {
      async function load() {
         const pageData = await PLASMIC.maybeFetchComponentData(path);
         //console.log("pageData", pageData);
         setPageData(pageData);
         setLoading(false);
      }
      load();
   }, []);

   if (loading) {
      return <Wrapper>Loading ...</Wrapper>;
   }
   if (!pageData) {
      return <Wrapper>Not found</Wrapper>;
   }

   const pageMeta = pageData.entryCompMetas[0];

   // The page will already be cached from the `load` call above.
   return (
      <PlasmicRootProvider loader={PLASMIC} pageParams={pageMeta.params} Link={CustomLink}>
         <PlasmicComponent component={path} />
      </PlasmicRootProvider>
   );
}

export function createWouterPlasmicApp(PLASMIC: PlasmicComponentLoader, prefix = "") {
   return function App() {
      return (
         <Router base={prefix}>
            <Switch>
               <Route path="/host" component={PlasmicCanvasHost as any} />
               <Route
                  path="/*"
                  component={() => <CatchAllPage PLASMIC={PLASMIC} prefix={prefix} />}
               />
            </Switch>
         </Router>
      );
   };
}
