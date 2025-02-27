import { useBaseUrl } from "../client/ClientProvider";

export function Context() {
   const baseurl = useBaseUrl();

   return (
      <div>
         {JSON.stringify(
            {
               baseurl,
            },
            null,
            2,
         )}
      </div>
   );
}
