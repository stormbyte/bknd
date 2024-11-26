import { withApi } from "bknd/adapter/nextjs";
import type { InferGetServerSidePropsType } from "next";
import dynamic from "next/dynamic";

export const getServerSideProps = withApi(async (context) => {
   return {
      props: {
         user: context.api.getUser()
      }
   };
});

export function adminPage() {
   const Admin = dynamic(() => import("bknd/ui").then((mod) => mod.Admin), { ssr: false });
   const ClientProvider = dynamic(() => import("bknd/ui").then((mod) => mod.ClientProvider));
   return (props: InferGetServerSidePropsType<typeof getServerSideProps>) => {
      if (typeof document === "undefined") return null;
      return (
         <ClientProvider user={props.user}>
            <Admin />
         </ClientProvider>
      );
   };
}
