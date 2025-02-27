import { getApi } from "@/bknd";

export default async function SSRPage() {
   const api = await getApi({ verify: true });
   const { data } = await api.data.readMany("posts");

   return (
      <div>
         <h1>Server-Side Rendered Page</h1>
         <pre>{JSON.stringify(data, null, 2)}</pre>
         <pre>{JSON.stringify(api.getUser(), null, 2)}</pre>
      </div>
   );
}
