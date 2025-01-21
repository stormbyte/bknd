import { useEffect, useRef } from "react";

export function useEffectOnce(effect: () => void | (() => void | undefined), deps: any[]): void {
   const hasRunRef = useRef(false);
   const savedDepsRef = useRef<any[] | undefined>(deps);

   useEffect(() => {
      const depsChanged = !hasRunRef.current || !areDepsEqual(savedDepsRef.current, deps);

      if (depsChanged) {
         hasRunRef.current = true;
         savedDepsRef.current = deps;
         return effect();
      }
   }, [deps]);
}

function areDepsEqual(prevDeps: any[] | undefined, nextDeps: any[]): boolean {
   if (prevDeps && prevDeps.length === 0 && nextDeps.length === 0) {
      return true;
   }

   if (!prevDeps && nextDeps.length === 0) {
      return true;
   }

   if (!prevDeps || !nextDeps || prevDeps.length !== nextDeps.length) {
      return false;
   }

   return prevDeps.every((dep, index) => Object.is(dep, nextDeps[index]));
}
