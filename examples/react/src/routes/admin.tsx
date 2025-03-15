import { Admin, type BkndAdminProps } from "bknd/ui";
import type { App } from "bknd";

export default function AdminPage({
   app,
   ...props
}: Omit<BkndAdminProps, "withProvider"> & { app: App }) {
   return <Admin {...props} withProvider={{ api: app.getApi() }} />;
}
