import { useBknd } from "ui/client/bknd";
import { Button } from "ui/components/buttons/Button";
import {
   AnyOf,
   Field,
   Form,
   FormContextOverride,
   FormDebug,
   FormDebug2,
   ObjectField
} from "ui/components/form/json-schema-form";
import { Scrollable } from "ui/layouts/AppShell/AppShell";

const schema2 = {
   type: "object",
   properties: {
      name: { type: "string", default: "Peter" },
      age: { type: "number" },
      gender: {
         type: "string",
         enum: ["male", "female", "uni"]
      },
      deep: {
         type: "object",
         properties: {
            nested: { type: "string" }
         }
      }
   },
   required: ["age"]
};

export default function JsonSchemaForm3() {
   const { schema, config } = useBknd();

   return (
      <Scrollable>
         <div className="flex flex-col p-3">
            <Form schema={schema2} className="flex flex-col gap-3">
               <div>random thing</div>
               <Field name="name" />
               <Field name="age" />
               <FormDebug />
               <FormDebug2 name="name" />
            </Form>

            {/*<Form
            schema={{
               type: "object",
               properties: {
                  bla: {
                     anyOf: [
                        {
                           type: "object",
                           properties: {
                              name: { type: "string" },
                              age: { type: "number" }
                           }
                        },
                        {
                           type: "object",
                           properties: {
                              start: { type: "string", enum: ["a", "b", "c"] },
                              end: { type: "number" }
                           }
                        }
                     ]
                  }
               }
            }}
         >
            <AutoForm />
         </Form>*/}

            {/*<Form
            schema={{
               type: "object",
               properties: {
                  title: {
                     type: "string"
                  },
                  tags: {
                     type: "array",
                     items: {
                        type: "string"
                     }
                  }
               }
            }}
            initialValues={{ tags: ["a", "b", "c"] }}
         >
            <AutoForm />
         </Form>*/}
            {/*<Form
               schema={{
                  type: "object",
                  properties: {
                     title: {
                        type: "string"
                     },
                     tags: {
                        type: "array",
                        items: {
                           type: "number"
                        }
                     },
                     method: {
                        type: "array",
                        uniqueItems: true,
                        items: {
                           type: "string",
                           enum: ["GET", "POST", "PUT", "DELETE"]
                        }
                     }
                  }
               }}
               initialValues={{ tags: [0, 1] }}
               options={{ debug: true }}
            >
               <Field name="" />
               <FormDebug />
            </Form>*/}

            {/*<Form
               schema={{
                  type: "object",
                  properties: {
                     title: {
                        type: "string"
                     },
                     tags: {
                        type: "array",
                        items: {
                           anyOf: [
                              { type: "string", title: "String" },
                              { type: "number", title: "Number" }
                           ]
                        }
                     }
                  }
               }}
               initialValues={{ tags: [0, 1] }}
            />*/}

            {/*<CustomMediaForm />*/}
            {/*<Form schema={schema.media} initialValues={config.media} />*/}

            {/*<Form
               schema={removeKeyRecursively(schema.media, "pattern") as any}
               initialValues={config.media}
            >
               <AutoForm />
            </Form>*/}

            {/*<Form
               schema={removeKeyRecursively(schema.server, "pattern") as any}
               initialValues={config.server}
            >
               <AutoForm />
            </Form>*/}
         </div>
      </Scrollable>
   );
}

function CustomMediaForm() {
   const { schema, config } = useBknd();

   return (
      <Form schema={schema.media} initialValues={config.media} className="flex flex-col gap-3">
         <Field name="enabled" />
         <Field name="basepath" />
         <Field name="entity_name" />
         <Field name="storage" />
         <AnyOf.Root path="adapter">
            <CustomMediaFormAdapter />
         </AnyOf.Root>
      </Form>
   );
}

function CustomMediaFormAdapter() {
   const ctx = AnyOf.useContext();

   return (
      <>
         <div className="flex flex-row gap-1">
            {ctx.schemas?.map((schema: any, i) => (
               <Button
                  key={i}
                  onClick={() => ctx.select(i)}
                  variant={ctx.selected === i ? "primary" : "default"}
               >
                  {schema.title ?? `Option ${i + 1}`}
               </Button>
            ))}
         </div>

         {ctx.selected !== null && (
            <FormContextOverride schema={ctx.selectedSchema} path={ctx.path} overrideData>
               <Field name="type" hidden />
               <ObjectField path="config" wrapperProps={{ label: false, wrapper: "group" }} />
            </FormContextOverride>
         )}
      </>
   );
}
