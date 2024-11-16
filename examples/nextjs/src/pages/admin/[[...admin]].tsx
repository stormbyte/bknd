import type { PageConfig } from "next";
import dynamic from "next/dynamic";

export const config: PageConfig = {
   runtime: "experimental-edge"
};

const Admin = dynamic(() => import("bknd/ui").then((mod) => mod.Admin), { ssr: false });
import "bknd/dist/styles.css";

export default function AdminPage() {
   if (typeof document === "undefined") return null;
   return <Admin withProvider />;
}
