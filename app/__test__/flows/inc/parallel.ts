import { Flow } from "../../../src/flows";
import { getNamedTask } from "./helper";

const first = getNamedTask("first");
const second = getNamedTask("second", undefined, 1000);
const third = getNamedTask("third");
const fourth = getNamedTask("fourth");
const fifth = getNamedTask("fifth"); // without connection

const parallel = new Flow("Parallel", [first, second, third, fourth, fifth]);
parallel.task(first).asInputFor(second);
parallel.task(first).asInputFor(third);
parallel.task(third).asInputFor(fourth);

export { parallel };
