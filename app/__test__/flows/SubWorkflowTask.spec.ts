import { describe, expect, test } from "bun:test";
import { Flow, LogTask, RenderTask, SubFlowTask } from "../../src/flows";

describe("SubFlowTask", async () => {
   test("Simple Subflow", async () => {
      const subTask = new RenderTask("render", {
         render: "subflow"
      });
      const subflow = new Flow("subflow", [subTask]);

      const task = new LogTask("log");
      const task2 = new SubFlowTask("sub", {
         flow: subflow
      });
      const task3 = new RenderTask("render2", {
         render: "Subflow output: {{ sub.output }}"
      });

      const flow = new Flow("test", [task, task2, task3], []);
      flow.task(task).asInputFor(task2);
      flow.task(task2).asInputFor(task3);

      const execution = flow.createExecution();
      await execution.start();
      /*console.log(execution.logs);
      console.log(execution.getResponse());*/

      expect(execution.getResponse()).toEqual("Subflow output: subflow");
   });

   test("Simple loop", async () => {
      const subTask = new RenderTask("render", {
         render: "run {{ flow.output }}"
      });
      const subflow = new Flow("subflow", [subTask]);

      const task = new LogTask("log");
      const task2 = new SubFlowTask("sub", {
         flow: subflow,
         loop: true,
         input: [1, 2, 3]
      });
      const task3 = new RenderTask("render2", {
         render: `Subflow output: {{ sub.output | join: ", " }}`
      });

      const flow = new Flow("test", [task, task2, task3], []);
      flow.task(task).asInputFor(task2);
      flow.task(task2).asInputFor(task3);

      const execution = flow.createExecution();
      await execution.start();

      console.log("errors", execution.getErrors());

      /*console.log(execution.logs);
      console.log(execution.getResponse());*/

      expect(execution.getResponse()).toEqual("Subflow output: run 1, run 2, run 3");
   });

   test("Simple loop from flow input", async () => {
      const subTask = new RenderTask("render", {
         render: "run {{ flow.output }}"
      });

      const subflow = new Flow("subflow", [subTask]);

      const task = new LogTask("log");
      const task2 = new SubFlowTask("sub", {
         flow: subflow,
         loop: true,
         input: "{{ flow.output | json }}"
      });
      const task3 = new RenderTask("render2", {
         render: `Subflow output: {{ sub.output | join: ", " }}`
      });

      const flow = new Flow("test", [task, task2, task3], []);
      flow.task(task).asInputFor(task2);
      flow.task(task2).asInputFor(task3);

      const execution = flow.createExecution();
      await execution.start([4, 5, 6]);

      /*console.log(execution.logs);
      console.log(execution.getResponse());*/

      expect(execution.getResponse()).toEqual("Subflow output: run 4, run 5, run 6");
   });
});
