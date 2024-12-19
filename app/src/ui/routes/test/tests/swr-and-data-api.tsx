import { useEffect, useState } from "react";
import { useEntity, useEntityQuery } from "ui/client/api/use-entity";
import { Scrollable } from "ui/layouts/AppShell/AppShell";

export default function SwrAndDataApi() {
   return (
      <div>
         <DirectDataApi />
         <QueryDataApi />
      </div>
   );
}

function QueryDataApi() {
   const [text, setText] = useState("");
   const { data, update, ...r } = useEntityQuery("comments", 1, {});
   const comment = data ? data : null;

   useEffect(() => {
      setText(comment?.content ?? "");
   }, [comment]);

   return (
      <Scrollable>
         <pre>{JSON.stringify(r.key)}</pre>
         {r.error && <div>failed to load</div>}
         {r.isLoading && <div>loading...</div>}
         {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
         {data && (
            <form
               onSubmit={async (e) => {
                  e.preventDefault();
                  if (!comment) return;
                  await update({ content: text });
                  return false;
               }}
            >
               <input type="text" value={text} onChange={(e) => setText(e.target.value)} />
               <button type="submit">submit</button>
            </form>
         )}
      </Scrollable>
   );
}

function DirectDataApi() {
   const [data, setData] = useState<any>();
   const { create, read, update, _delete } = useEntity("comments", 1);

   useEffect(() => {
      read().then(setData);
   }, []);

   return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
