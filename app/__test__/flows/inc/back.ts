import { Condition, Flow } from "../../../src/flows";
import { getNamedTask } from "./helper";

const first = getNamedTask("first");
const second = getNamedTask("second");
const fourth = getNamedTask("fourth");

let thirdRuns = 0;
const third = getNamedTask("third", async () => {
   thirdRuns++;
   if (thirdRuns === 3) {
      return true;
   }

   throw new Error("Third failed");
});

const back = new Flow("back", [first, second, third, fourth]);
back.task(first).asInputFor(second);
back.task(second).asInputFor(third);
back.task(third).asInputFor(second, Condition.error(), 2);
back.task(third).asInputFor(fourth, Condition.success());

export { back };
