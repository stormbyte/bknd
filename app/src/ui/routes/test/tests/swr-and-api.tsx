import { useState } from "react";
import { useApiQuery } from "ui/client";
import { Scrollable } from "ui/layouts/AppShell/AppShell";

export default function SWRAndAPI() {
   const [enabled, setEnabled] = useState(false);
   const { data, error, isLoading } = useApiQuery(({ data }) => data.readMany("posts"), {
      enabled,
      revalidateOnFocus: true
   });

   return (
      <Scrollable>
         <button onClick={() => setEnabled((p) => !p)}>{enabled ? "disable" : "enable"}</button>
         {error && <div>failed to load</div>}
         {isLoading && <div>loading...</div>}
         {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
      </Scrollable>
   );
}
