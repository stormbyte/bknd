import { Suspense, lazy, useEffect, useState } from "react";

const Admin = lazy(() => import("bknd/ui").then((mod) => ({ default: mod.Admin })));
import "bknd/dist/styles.css";

export default function AdminPage() {
   const [loaded, setLoaded] = useState(false);
   useEffect(() => {
      if (typeof window === "undefined") return;
      setLoaded(true);
   }, []);
   if (!loaded) return null;

   return (
      <Suspense>
         <Admin />
      </Suspense>
   );
}
