import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { useBknd } from "ui/client/BkndProvider";
import { JsonSchemaForm } from "ui/components/form/json-schema";
import { Scrollable } from "ui/layouts/AppShell/AppShell";

function useSchema() {
   const [schema, setSchema] = useState<any>();

   useEffect(() => {
      if (schema) return;

      fetch("/api/system/schema")
         .then((res) => res.json())
         .then((data) => setSchema(data));
   }, []);

   return schema;
}

const uiSchema = {
   auth: {
      jwt: {
         basepath: {
            "ui:options": {
               label: false,
            },
         },
         fields: {
            "ui:options": {
               label: false,
               orderable: false,
            },
         },
      },
      strategies: {
         additionalProperties: {
            "ui:widget": "select",
            type: {
               "ui:widget": "hidden",
            },
         },
         type: {
            "ui:widget": "hidden",
         },
      },
   },
   server: {
      cors: {
         allow_methods: {
            "ui:widget": "checkboxes",
         },
         allow_headers: {
            "ui:options": {
               orderable: false,
            },
         },
      },
   },
   media: {
      adapter: {
         "ui:options": {
            label: false,
         },
         type: {
            "ui:widget": "hidden",
         },
      },
   },
};

export default function SchemaTest() {
   const { app, schema } = useBknd();
   const keys = ["auth", "server", "media", "data"] as const;
   const [tab, setTab] = useState(keys[0]);
   console.log("schema", schema, app.config);

   if (!schema) return;

   const current = {
      key: tab,
      schema: schema[tab],
      uiSchema: uiSchema[tab] || {},
      config: app.config[tab],
   };
   console.log("current", current);

   return (
      <Scrollable>
         <div className="flex flex-col gap-2 p-3">
            <div className="flex flex-row gap-2">
               {keys.map((key) => (
                  <button
                     key={key}
                     role="button"
                     className={twMerge("flex py-2 px-3", key === tab && "bg-primary/5")}
                     onClick={() => setTab(key as any)}
                  >
                     {key}
                  </button>
               ))}
            </div>
            <JsonSchemaForm
               schema={current.schema}
               formData={current.config}
               uiSchema={current.uiSchema}
               onChange={console.log}
               className="legacy"
            />
         </div>
      </Scrollable>
   );
}
