import { FetchTask } from "flows";
import { useState } from "react";
import { TaskForm } from "ui/modules/flows/components/form/TaskForm";

export default function FlowFormTest() {
   const [data, setData] = useState(null);
   const task = new FetchTask("Fetch Something", {
      url: "https://jsonplaceholder.typicode.com/todos/1",
      method: "{{ input.mode }}"
   });

   return (
      <div className="flex flex-col p-3">
         <TaskForm task={task} onChange={setData as any} />
         <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
   );
}
