import type { Schema } from "@cfworker/json-schema";
import { useState } from "react";
import { JsonSchemaForm } from "../../../components/form/json-schema/JsonSchemaForm";
import { Scrollable } from "../../../layouts/AppShell/AppShell";

const schema: Schema = {
   definitions: {
      primitive: {
         anyOf: [
            {
               title: "String",
               type: "string",
            },
            {
               title: "Number",
               type: "number",
            },
            {
               title: "Boolean",
               type: "boolean",
            },
         ],
      },
      numeric: {
         anyOf: [
            {
               title: "Number",
               type: "number",
            },
            {
               title: "Datetime",
               type: "string",
               format: "date-time",
            },
            {
               title: "Date",
               type: "string",
               format: "date",
            },
            {
               title: "Time",
               type: "string",
               format: "time",
            },
         ],
      },
      boolean: {
         title: "Boolean",
         type: "boolean",
      },
   },
   type: "object",
   properties: {
      operand: {
         enum: ["$and", "$or"],
         default: "$and",
         type: "string",
      },
      conditions: {
         type: "array",
         items: {
            type: "object",
            properties: {
               operand: {
                  enum: ["$and", "$or"],
                  default: "$and",
                  type: "string",
               },
               key: {
                  type: "string",
               },
               operator: {
                  type: "array",
                  items: {
                     anyOf: [
                        {
                           title: "Equals",
                           type: "object",
                           properties: {
                              $eq: {
                                 $ref: "#/definitions/primitive",
                              },
                           },
                           required: ["$eq"],
                        },
                        {
                           title: "Lower than",
                           type: "object",
                           properties: {
                              $lt: {
                                 $ref: "#/definitions/numeric",
                              },
                           },
                           required: ["$lt"],
                        },
                        {
                           title: "Greather than",
                           type: "object",
                           properties: {
                              $gt: {
                                 $ref: "#/definitions/numeric",
                              },
                           },
                           required: ["$gt"],
                        },
                        {
                           title: "Between",
                           type: "object",
                           properties: {
                              $between: {
                                 type: "array",
                                 items: {
                                    $ref: "#/definitions/numeric",
                                 },
                                 minItems: 2,
                                 maxItems: 2,
                              },
                           },
                           required: ["$between"],
                        },
                        {
                           title: "In",
                           type: "object",
                           properties: {
                              $in: {
                                 type: "array",
                                 items: {
                                    $ref: "#/definitions/primitive",
                                 },
                                 minItems: 1,
                              },
                           },
                        },
                     ],
                  },
                  minItems: 1,
               },
            },
            required: ["key", "operator"],
         },
         minItems: 1,
      },
   },
   required: ["operand", "conditions"],
};

export default function QueryJsonFormTest() {
   const [data, setData] = useState(null);

   return (
      <Scrollable>
         <div className="flex flex-col gap-3 p-3">
            <JsonSchemaForm schema={schema} onChange={setData as any} />
            <pre>{JSON.stringify(data, null, 2)}</pre>
         </div>
      </Scrollable>
   );
}
