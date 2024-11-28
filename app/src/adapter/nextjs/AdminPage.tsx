import { withApi } from "bknd/adapter/nextjs";
import type { BkndAdminProps } from "bknd/ui";
import type { InferGetServerSidePropsType } from "next";
import dynamic from "next/dynamic";

export const getServerSideProps = withApi(async (context) => {
   return {
      props: {
         user: context.api.getUser()
      }
   };
});

export function adminPage(adminProps?: BkndAdminProps) {
   const Admin = dynamic(() => import("bknd/ui").then((mod) => mod.Admin), { ssr: false });
   return (props: InferGetServerSidePropsType<typeof getServerSideProps>) => {
      if (typeof document === "undefined") return null;
      return <Admin withProvider={{ user: props.user }} {...adminProps} />;
   };
}
