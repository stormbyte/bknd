import type { registerComponent, registerGlobalContext } from "@plasmicapp/host";
import { registerImage } from "./components/Image";
import { registerLazyRender } from "./components/LazyRender";
import { registerBkndData } from "./components/data/BkndData";
import { registerBkndContext } from "./contexts/BkndContext";

export function registerAll(loader?: {
   registerComponent: typeof registerComponent;
   registerGlobalContext: typeof registerGlobalContext;
}) {
   registerBkndData(loader);
   registerBkndContext(loader);
   registerImage(loader);
   registerLazyRender(loader);
}

export { registerBkndData, registerBkndContext };
