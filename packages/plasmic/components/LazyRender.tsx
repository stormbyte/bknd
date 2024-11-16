import type { CodeComponentMeta } from "@plasmicapp/host";
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
   onBecomesVisible,
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
         threshold: threshold < 1 ? threshold : 0.1,
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

export const LazyRenderMeta: CodeComponentMeta<React.ComponentType<LazyRenderProps>> = {
   name: "LazyRender",
   importPath: import.meta.dir,
   props: {
      forceLoad: {
         type: "boolean",
         defaultValue: false,
      },
      forceFallback: {
         type: "boolean",
         defaultValue: false,
      },
      threshold: {
         type: "number",
         defaultValue: 0.1,
      },
      fallback: {
         type: "slot",
         //allowedComponents: ["*"],
      },
      delay: {
         type: "number",
         defaultValue: 0,
      },
      onBecomesVisible: {
         type: "code",
         lang: "javascript",
      },

      children: {
         type: "slot",
         //allowedComponents: ["*"],
      },
   },
};
