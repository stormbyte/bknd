import { Flow } from "../flows/Flow";
import { FetchTask } from "../tasks/presets/FetchTask";
import { LogTask } from "../tasks/presets/LogTask";

const first = new LogTask("First", { delay: 1000 });
const second = new LogTask("Second", { delay: 1000 });
const third = new LogTask("Long Third", { delay: 2500 });
const fourth = new FetchTask("Fetch Something", {
   url: "https://jsonplaceholder.typicode.com/todos/1",
});
const fifth = new LogTask("Task 4", { delay: 500 }); // without connection

const simpleFetch = new Flow("simpleFetch", [first, second, third, fourth, fifth]);
simpleFetch.task(first).asInputFor(second);
simpleFetch.task(first).asInputFor(third);
simpleFetch.task(fourth).asOutputFor(third);

simpleFetch.setRespondingTask(fourth);

export { simpleFetch };
