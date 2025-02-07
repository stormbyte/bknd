import { useBknd } from "ui/client/bknd";
import { Button } from "ui/components/buttons/Button";
import {
   AnyOf,
   AnyOfField,
   Field,
   Form,
   FormContextOverride,
   FormDebug,
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

   config.media.storage.body_max_size = 1;
   schema.media.properties.storage.properties.body_max_size.minimum = 0;

   return (
      <Scrollable>
         <div className="flex flex-col p-3">
            {/*<Form
               schema={{
                  type: "object",
                  properties: {
                     name: { type: "string", default: "Peter", maxLength: 3 },
                     age: { type: "number" },
                     deep: {
                        type: "object",
                        properties: {
                           nested: { type: "string" }
                        }
                     }
                  },
                  required: ["age"]
               }}
               initialValues={{ name: "Peter", age: 20, deep: { nested: "hello" } }}
               className="flex flex-col gap-3"
               validateOn="change"
            />*/}

            {/*<Form
               schema={{
                  type: "object",
                  properties: {
                     name: { type: "string", default: "Peter", minLength: 3 },
                     age: { type: "number" },
                     deep: {
                        anyOf: [
                           {
                              type: "object",
                              properties: {
                                 nested: { type: "string" }
                              }
                           },
                           {
                              type: "object",
                              properties: {
                                 nested2: { type: "string" }
                              }
                           }
                        ]
                     }
                  },
                  required: ["age"]
               }}
               className="flex flex-col gap-3"
               validateOn="change"
            >
               <Field name="" />
               <Subscribe2>
                  {(state) => (
                     <pre className="text-wrap whitespace-break-spaces  break-all">
                        {JSON.stringify(state, null, 2)}
                     </pre>
                  )}
               </Subscribe2>
            </Form>*/}

            {/*<Form
               schema={{
                  type: "object",
                  properties: {
                     name: { type: "string", default: "Peter", maxLength: 3 },
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
               }}
               className="flex flex-col gap-3"
               validateOn="change"
            >
               <div>random thing</div>
               <Field name="name" />
               <Field name="age" />
               <FormDebug />
               <FormDebug2 name="name" />
               <hr />
               <Subscribe2
               selector={(state) => ({ dirty: state.dirty, submitting: state.submitting })}
               >
                  {(state) => (
                     <pre className="text-wrap whitespace-break-spaces  break-all">
                        {JSON.stringify(state)}
                     </pre>
                  )}
               </Subscribe2>
            </Form>*/}

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
               initialValues={{ tags: [0, 1], method: ["GET"] }}
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
            >
               <Field name="" />
               <FormDebug force />
            </Form>*/}

            <CustomMediaForm />
            {/*<Form schema={schema.media} initialValues={config.media} validateOn="change">
               <Field name="" />
            </Form>*/}

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

   config.media.storage.body_max_size = 1;
   schema.media.properties.storage.properties.body_max_size.minimum = 0;

   return (
      <Form
         schema={schema.media}
         initialValues={config.media}
         className="flex flex-col gap-3"
         validateOn="change"
      >
         <Field name="enabled" />
         <Field name="basepath" />
         <Field name="entity_name" />
         <Field name="storage" />
         <AnyOf.Root path="adapter">
            <CustomMediaFormAdapter />
         </AnyOf.Root>
         <FormDebug force />
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
            <FormContextOverride schema={ctx.selectedSchema} prefix={ctx.path}>
               <Field name="type" hidden />
               <ObjectField path="config" wrapperProps={{ label: false, wrapper: "group" }} />
            </FormContextOverride>
         )}
      </>
   );
}
