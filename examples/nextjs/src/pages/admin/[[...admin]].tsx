import { withApi } from "bknd/adapter/nextjs";
import dynamic from "next/dynamic";
import "bknd/dist/styles.css";

const Admin = dynamic(() => import("bknd/ui").then((mod) => mod.Admin), {
   ssr: false
});

export const getServerSideProps = withApi(async (context) => {
   return {
      props: {
         user: context.api.getUser()
      }
   };
});

export default function AdminPage() {
   if (typeof document === "undefined") return null;
   return <Admin withProvider config={{ basepath: "/admin" }} />;
}
