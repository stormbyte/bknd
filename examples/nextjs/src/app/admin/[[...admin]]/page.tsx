import { Admin } from "bknd/ui";
import "bknd/dist/styles.css";
import { getApi } from "@/bknd";

export default async function AdminPage() {
   const api = await getApi({ verify: true });

   return (
      <Admin
         withProvider={{ user: api.getUser() }}
         config={{
            basepath: "/admin",
            logo_return_path: "/../",
            color_scheme: "system",
         }}
      />
   );
}
