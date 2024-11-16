import { useEffect, useState } from "react";

export function SqlAiTest() {
   const [answer, setAnswer] = useState<any>([]);
   const [loading, setLoading] = useState(false);

   async function handleStart() {
      if (loading) return;

      setAnswer([]);
      setLoading(true);
      const source = new EventSource("/api/system/test/sql");
      source.onmessage = (event) => {
         if (event.data === "[DONE]") {
            setLoading(false);
            source.close();
            return;
         }
         const data = JSON.parse(event.data);
         setAnswer((prev) => [...prev, data]);
         console.log("data", data);
      };
   }

   return (
      <div className="flex flex-col gap-2 p-4">
         <h1>ai sql test</h1>
         <button onClick={handleStart}>{loading ? "..." : "start"}</button>

         <div>
            {answer.map((item, key) => (
               <span key={key}>{item.response}</span>
            ))}
         </div>
      </div>
   );
}
