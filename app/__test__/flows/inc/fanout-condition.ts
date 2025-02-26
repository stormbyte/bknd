import { Condition, Flow } from "../../../src/flows";
import { getNamedTask } from "./helper";

const first = getNamedTask(
   "first",
   async () => {
      //throw new Error("Error");
      return {
         inner: {
            result: 2,
         },
      };
   },
   1000,
);
const second = getNamedTask("second (if match)");
const third = getNamedTask("third (if error)");

const fanout = new Flow("fanout", [first, second, third]);
fanout.task(first).asInputFor(third, Condition.error(), 2);
fanout.task(first).asInputFor(second, Condition.matches("inner.result", 2));

export { fanout };
