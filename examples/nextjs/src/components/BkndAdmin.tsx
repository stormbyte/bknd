import dynamic from "next/dynamic";

const Admin = dynamic(() => import("bknd/ui").then((mod) => mod.Admin), { ssr: false });
if (typeof window !== "undefined") {
   // @ts-ignore
   import("bknd/dist/styles.css");
}

export function BkndAdmin() {
   return <Admin />;
}
