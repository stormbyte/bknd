import { Box, Text, render, useApp, useInput } from "ink";
import React, { useEffect } from "react";
import { ExecutionEvent, type Flow, type Task } from "../../src/flows";
import { back } from "./inc/back";
import { fanout } from "./inc/fanout-condition";
import { parallel } from "./inc/parallel";
import { simpleFetch } from "./inc/simple-fetch";

const flows = {
   back,
   fanout,
   parallel,
   simpleFetch
};

const arg = process.argv[2];
if (!arg) {
   console.log("Please provide a flow name:", Object.keys(flows).join(", "));
   process.exit(1);
}
if (!flows[arg]) {
   console.log("Flow not found:", arg, Object.keys(flows).join(", "));
   process.exit(1);
}

console.log(JSON.stringify(flows[arg].toJSON(), null, 2));
process.exit();

const colors = [
   "#B5E61D", // Lime Green
   "#4A90E2", // Bright Blue
   "#F78F1E", // Saffron
   "#BD10E0", // Vivid Purple
   "#50E3C2", // Turquoise
   "#9013FE" // Grape
];

const colorsCache: Record<string, string> = {};

type Sequence = { source: string; target: string }[];
type Layout = Task[][];
type State = { layout: Layout; connections: Sequence };
type TaskWithStatus = { task: Task; status: string };

function TerminalFlow({ flow }: { flow: Flow }) {
   const [tasks, setTasks] = React.useState<TaskWithStatus[]>([]);
   const sequence = flow.getSequence();
   const connections = flow.connections;

   const { exit } = useApp();
   useInput((input, key) => {
      if (input === "q") {
         exit();
         return;
      }

      if (key.return) {
         // Left arrow key pressed
         console.log("Enter pressed");
      } else {
         console.log(input);
      }
   });

   useEffect(() => {
      setTasks(flow.tasks.map((t) => ({ task: t, status: "pending" })));

      const execution = flow.createExecution();
      execution.subscribe((event) => {
         if (event instanceof ExecutionEvent) {
            setTasks((prev) =>
               prev.map((t) => {
                  if (t.task.name === event.task().name) {
                     let newStatus = "pending";
                     if (event.isStart()) {
                        newStatus = "running";
                     } else {
                        newStatus = event.succeeded() ? "success" : "failure";
                     }

                     return { task: t.task, status: newStatus };
                  }

                  return t;
               })
            );
         }
      });

      execution.start().then(() => {
         const response = execution.getResponse();
         console.log("done", response ? response : "(no response)");
         console.log(
            "Executed tasks:",
            execution.logs.map((l) => l.task.name)
         );
         console.log("Executed count:", execution.logs.length);
      });
   }, []);

   function getColor(key: string) {
      if (!colorsCache[key]) {
         colorsCache[key] = colors[Object.keys(colorsCache).length];
      }
      return colorsCache[key];
   }

   if (tasks.length === 0) {
      return <Text>Loading...</Text>;
   }

   return (
      <Box flexDirection="column">
         {sequence.map((step, stepIndex) => {
            return (
               <Box key={stepIndex} flexDirection="row">
                  {step.map((_task, index) => {
                     const find = tasks.find((t) => t.task.name === _task.name)!;

                     if (!find) {
                        //console.log("couldnt find", _task.name);
                        return null;
                     }
                     const { task, status } = find;

                     const inTasks = flow.task(task).getInTasks();

                     return (
                        <Box
                           key={index}
                           borderStyle="single"
                           marginX={1}
                           paddingX={1}
                           flexDirection="column"
                        >
                           {inTasks.length > 0 && (
                              <Box>
                                 <Text dimColor>In: </Text>
                                 <Box>
                                    {inTasks.map((inTask, i) => (
                                       <Text key={i} color={getColor(inTask.name)}>
                                          {i > 0 ? ", " : ""}
                                          {inTask.name}
                                       </Text>
                                    ))}
                                 </Box>
                              </Box>
                           )}
                           <Box flexDirection="column">
                              <Text bold color={getColor(task.name)}>
                                 {task.name}
                              </Text>
                              <Status status={status} />
                           </Box>
                        </Box>
                     );
                  })}
               </Box>
            );
         })}
      </Box>
   );
}

const Status = ({ status }: { status: string }) => {
   let color: string | undefined;
   switch (status) {
      case "running":
         color = "orange";
         break;
      case "success":
         color = "green";
         break;
      case "failure":
         color = "red";
         break;
   }

   return (
      <Text color={color} dimColor={!color}>
         {status}
      </Text>
   );
};

render(<TerminalFlow flow={flows[arg]} />);
