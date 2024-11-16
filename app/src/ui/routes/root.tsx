import { IconFingerprint, IconHome } from "@tabler/icons-react";
import { isDebug } from "core";
import { Suspense, lazy, useEffect } from "react";
import { useAuth } from "ui";
import { Empty } from "../components/display/Empty";
import { useBrowserTitle } from "../hooks/use-browser-title";
import * as AppShell from "../layouts/AppShell/AppShell";
import { useNavigate } from "../lib/routes";

// @todo: package is still required somehow
const ReactQueryDevtools = (p: any) => null; /*!isDebug()
   ? () => null // Render nothing in production
   : lazy(() =>
        import("@tanstack/react-query-devtools").then((res) => ({
           default: res.ReactQueryDevtools,
        })),
     );*/

export const Root = ({ children }) => {
   const { verify } = useAuth();

   useEffect(() => {
      verify();
   }, []);

   return (
      <AppShell.Root>
         <AppShell.Header />
         <AppShell.Content>{children}</AppShell.Content>

         <Suspense>
            <ReactQueryDevtools buttonPosition="bottom-left" />
         </Suspense>
      </AppShell.Root>
   );
};

export function RootEmpty() {
   const [navigate] = useNavigate();
   useEffect(() => {
      navigate("/data");
   }, []);

   useBrowserTitle();
   return (
      <Empty
         Icon={IconHome}
         title="Not implemented yet"
         description={`Go checkout "Data" or "Media" for some action.`}
      />
   );
}
