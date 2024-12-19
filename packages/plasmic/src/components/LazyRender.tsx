import type { CodeComponentMeta } from "@plasmicapp/host";
import registerComponent, { type ComponentMeta } from "@plasmicapp/host/registerComponent";
// biome-ignore lint/style/useImportType: <explanation>
import React from "react";
import { useEffect, useRef, useState } from "react";

interface LazyRenderProps {
   className?: string;
   forceLoad?: boolean;
   forceFallback?: boolean;
   threshold?: number;
   fallback?: React.ReactNode;
   delay?: number;
   children?: React.ReactNode;
   onBecomesVisible?: () => void;
}

const DefaultFallback = () => <div style={{ height: 50 }}>asdf</div>;

export const LazyRender: React.FC<LazyRenderProps> = ({
   className = "",
   children,
   forceLoad = false,
   forceFallback = false,
   threshold = 0.1,
   delay = 0,
   fallback = <DefaultFallback />,
   onBecomesVisible
}) => {
   const [isVisible, setIsVisible] = useState(forceLoad);
   const ref = useRef<HTMLDivElement>(null);
   /* console.log("props", {
      delay,
      threshold,
      fallback,
      isVisible,
      forceLoad,
      forceFallback,
      children,
   }); */

   useEffect(() => {
      if (forceLoad || forceFallback) {
         setIsVisible(true);
         return;
      }

      const observerOptions: IntersectionObserverInit = {
         threshold: threshold < 1 ? threshold : 0.1
      };

      const observerCallback: IntersectionObserverCallback = (entries) => {
         entries.forEach((entry) => {
            if (entry.isIntersecting && !isVisible) {
               setTimeout(() => {
                  setIsVisible(true);
                  onBecomesVisible?.();
                  if (ref.current) observer.unobserve(ref.current);
               }, delay);
            }
         });
      };

      const observer = new IntersectionObserver(observerCallback, observerOptions);

      if (ref.current) observer.observe(ref.current);

      return () => {
         if (ref.current) observer.unobserve(ref.current);
      };
   }, [forceLoad, threshold, forceFallback, delay]);

   return (
      <div className={className} ref={ref}>
         {isVisible && !forceFallback ? children : fallback}
      </div>
   );
};

export function registerLazyRender(
   loader?: { registerComponent: typeof registerComponent },
   customMeta?: ComponentMeta<LazyRenderProps>
) {
   if (loader) {
      loader.registerComponent(LazyRender, customMeta ?? LazyRenderMeta);
   } else {
      registerComponent(LazyRender, customMeta ?? LazyRenderMeta);
   }
}

export const LazyRenderMeta: CodeComponentMeta<LazyRenderProps> = {
   name: "LazyRender",
   importPath: "@bknd/plasmic",
   props: {
      forceLoad: {
         type: "boolean",
         defaultValue: false
      },
      forceFallback: {
         type: "boolean",
         defaultValue: false
      },
      threshold: {
         type: "number",
         defaultValue: 0.1
      },
      fallback: {
         type: "slot"
         //allowedComponents: ["*"],
      },
      delay: {
         type: "number",
         defaultValue: 0
      },
      onBecomesVisible: {
         type: "code",
         lang: "javascript"
      },

      children: {
         type: "slot"
         //allowedComponents: ["*"],
      }
   }
};
