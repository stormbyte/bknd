import type { FetchTask, TaskRenderProps } from "flows";
import { TbGlobe, TbWorld } from "react-icons/tb";
import { TaskComponent } from "./TaskComponent";

export function FetchTaskComponent(props: TaskRenderProps<FetchTask<any>>) {
   const { task, state } = props.data;
   return (
      <TaskComponent {...props} Icon={TbWorld}>
         <div>
            <div>URL: {task.params.url}</div>
            <div>Method: {task.params.method}</div>
            <div>Headers: {JSON.stringify(task.params.headers)}</div>
            <div>Body: {JSON.stringify(task.params.body)}</div>
         </div>
      </TaskComponent>
   );
}
