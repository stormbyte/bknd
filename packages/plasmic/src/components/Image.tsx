import type { CodeComponentMeta } from "@plasmicapp/host";
import registerComponent, { type ComponentMeta } from "@plasmicapp/host/registerComponent";
// biome-ignore lint/style/useImportType: <explanation>
import React from "react";
//import { PlasmicCanvasContext } from "@plasmicapp/loader-react";
import { useContext, useEffect, useRef, useState } from "react";

type PlasmicImageProps = {
   asset: {
      aspectRatio?: any;
      dataUri: string;
      name: string;
      type: string;
      uid: number;
      uuid: string;
      width: number;
      height: number;
   };
   uid: number;
};

type ImageProps = {
   className?: string;
   src?: string | PlasmicImageProps;
   alt?: string;
   width?: number | string;
   height?: number | string;
   ratio?: number;
   backgroundColor?: string;
   forceLoad?: boolean;
   transformations?: string;
   transitionSpeed?: number;
   loadTreshold?: number;
};

function numeric(value: number | string): number {
   return typeof value === "number" ? value : Number.parseFloat(value);
}

function getDimensionDefaults(
   width: number | string | undefined,
   height: number | string | undefined,
   ratio: number | undefined
) {
   let _width = width;
   let _height = height;
   let _ratio = ratio;

   if (_width && ratio) {
      _height = (1 / ratio) * numeric(_width);
   } else if (_height && ratio) {
      _width = ratio * numeric(_height);
   }

   if (_width && _height && !_ratio) {
      _ratio = numeric(_width) / numeric(_height);
   }

   return { width: _width, height: _height, ratio: _ratio };
}

function getPlaceholderStyle(
   width: number | string | undefined,
   height: number | string | undefined,
   ratio: number | undefined
) {
   let paddingBottom = 0;
   if (width && height) {
      paddingBottom = (1 / (numeric(width) / numeric(height))) * 100;
      //paddingBottom = `${numeric(width)}px / ${numeric(height)}px * 100%}`;
      //
   } else if (ratio) {
      paddingBottom = (1 / ratio) * 100;
   }

   return {
      paddingBottom: paddingBottom + "%"
   };
}

export const Image: React.FC<ImageProps> = ({
   className,
   src,
   alt = "",
   width,
   height,
   ratio,
   backgroundColor = "rgba(225, 225, 225, 0.2)",
   forceLoad = false,
   transformations = "",
   transitionSpeed = 200,
   loadTreshold = 0.1,
   ...rest
}) => {
   const inEditor = false; // !!useContext(PlasmicCanvasContext);
   const [loaded, setLoaded] = useState(false);
   const [isInView, setIsInView] = useState(inEditor ?? forceLoad);
   const [transitioned, setTransitioned] = useState(forceLoad);
   const imgRef = useRef<any>(null);

   if (src) {
      if (typeof src === "object") {
         src = src.asset.dataUri;
      }

      if (/cloudinary/.test(src)) {
         if (transformations) {
            src = src.replace("/upload", "/upload/" + transformations);
         }
      }
   }

   //console.log("after:src", src);

   useEffect(() => {
      if (forceLoad) {
         setIsInView(true);
         return;
      }

      const observer = new IntersectionObserver(
         (entries) => {
            entries.forEach((entry) => {
               if (entry.isIntersecting) {
                  setIsInView(true);
                  observer.disconnect();
               }
            });
         },
         { threshold: loadTreshold }
      );
      if (imgRef.current) {
         observer.observe(imgRef.current);
      }

      return () => {
         observer.disconnect();
      };
   }, [forceLoad]);

   const onLoad = () => {
      setTimeout(() => {
         setLoaded(true);
      }, 0);

      setTimeout(() => {
         setTransitioned(true);
      }, transitionSpeed);
   };

   const {
      width: _width,
      height: _height,
      ratio: _ratio
   } = getDimensionDefaults(width, height, ratio);

   const imgStyle: any = {
      objectFit: "cover",
      transition: `opacity ${transitionSpeed}ms linear`,
      position: "relative",
      maxWidth: "100%",
      maxHeight: "100%",
      width: _width || "100%",
      height: "auto",
      //height: _height || "auto",
      //height: !transitioned ? _height || "auto" : "auto",
      opacity: forceLoad || loaded ? 1 : 0
   };

   const placeholderStyle: any = {
      position: "absolute",
      maxWidth: "100%",
      maxHeight: "100%",
      backgroundColor,
      width: _width || "100%",
      height: 0,
      //height: transitioned ? "auto" : 0,
      ...getPlaceholderStyle(_width, _height, _ratio)
   };

   const wrapperStyle: any = {
      position: "relative",
      width: _width,
      ...getPlaceholderStyle(_width, _height, _ratio),
      height: 0,
      margin: 0,
      lineHeight: 0,
      //height: _height,
      maxWidth: "100%",
      maxHeight: "100%"
   };
   if (loaded) {
      wrapperStyle.height = "auto";
      wrapperStyle.paddingBottom = 0;
   }

   if (!src) return <div className={className} style={wrapperStyle} ref={imgRef} />;

   return (
      <div className={className} style={wrapperStyle} ref={imgRef}>
         <div style={placeholderStyle} />
         {isInView && (
            <img
               src={src}
               alt={alt}
               onLoad={onLoad}
               style={imgStyle}
               width={_width}
               height={_height}
               {...rest}
            />
         )}
      </div>
   );
};

export function registerImage(
   loader?: { registerComponent: typeof registerComponent },
   customMeta?: ComponentMeta<ImageProps>
) {
   if (loader) {
      loader.registerComponent(Image, customMeta ?? ImageMeta);
   } else {
      registerComponent(Image, customMeta ?? ImageMeta);
   }
}

export const ImageMeta: CodeComponentMeta<ImageProps> = {
   name: "ImageLazy",
   importPath: "@bknd/plasmic",
   props: {
      src: {
         type: "imageUrl",
         displayName: "Image"
      },
      alt: "string",
      width: "number",
      height: "number",
      ratio: "number",
      forceLoad: "boolean",
      transformations: "string",
      //backgroundColor: "color",
      transitionSpeed: {
         type: "number",
         helpText: "How fast image should fade in. Default is 200 (ms)."
      },
      loadTreshold: {
         type: "number",
         displayName: "Treshold",
         //defaultValue: 0.1,
         helpText:
            "Number between 0 and 1. Default is 0.1. Determines how much of the image must be in viewport before it gets loaded"
      }
   }
};
