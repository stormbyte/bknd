import { useBknd } from "ui/client/bknd";
import { Button } from "ui/components/buttons/Button";
import { AnyOf, useAnyOfContext } from "ui/components/form/json-schema-form3/AnyOfField";
import { Field } from "ui/components/form/json-schema-form3/Field";
import { Form, FormContextOverride } from "ui/components/form/json-schema-form3/Form";
import { ObjectField } from "ui/components/form/json-schema-form3/ObjectField";
import { removeKeyRecursively } from "ui/components/form/json-schema-form3/utils";
import { Scrollable } from "ui/layouts/AppShell/AppShell";

const mediaSchema = {
   additionalProperties: false,
   type: "object",
   properties: {
      enabled: {
         default: false,
         type: "boolean"
      },
      basepath: {
         default: "/api/media",
         type: "string"
      },
      entity_name: {
         default: "media",
         type: "string"
      },
      storage: {
         default: {},
         type: "object",
         properties: {
            body_max_size: {
               description: "Max size of the body in bytes. Leave blank for unlimited.",
               type: "number"
            }
         }
      },
      adapter: {
         anyOf: [
            {
               title: "s3",
               additionalProperties: false,
               type: "object",
               properties: {
                  type: {
                     default: "s3",
                     const: "s3",
                     readOnly: true,
                     type: "string"
                  },
                  config: {
                     title: "S3",
                     type: "object",
                     properties: {
                        access_key: {
                           type: "string"
                        },
                        secret_access_key: {
                           type: "string"
                        },
                        url: {
                           pattern: "^https?://[^/]+",
                           description: "URL to S3 compatible endpoint without trailing slash",
                           examples: [
                              "https://{account_id}.r2.cloudflarestorage.com/{bucket}",
                              "https://{bucket}.s3.{region}.amazonaws.com"
                           ],
                           type: "string"
                        }
                     },
                     required: ["access_key", "secret_access_key", "url"]
                  }
               },
               required: ["type", "config"]
            },
            {
               title: "cloudinary",
               additionalProperties: false,
               type: "object",
               properties: {
                  type: {
                     default: "cloudinary",
                     const: "cloudinary",
                     readOnly: true,
                     type: "string"
                  },
                  config: {
                     title: "Cloudinary",
                     type: "object",
                     properties: {
                        cloud_name: {
                           type: "string"
                        },
                        api_key: {
                           type: "string"
                        },
                        api_secret: {
                           type: "string"
                        },
                        upload_preset: {
                           type: "string"
                        }
                     },
                     required: ["cloud_name", "api_key", "api_secret"]
                  }
               },
               required: ["type", "config"]
            },
            {
               title: "local",
               additionalProperties: false,
               type: "object",
               properties: {
                  type: {
                     default: "local",
                     const: "local",
                     readOnly: true,
                     type: "string"
                  },
                  config: {
                     title: "Local",
                     type: "object",
                     properties: {
                        path: {
                           default: "./",
                           type: "string"
                        }
                     },
                     required: ["path"]
                  }
               },
               required: ["type", "config"]
            }
         ]
      }
   },
   required: ["enabled", "basepath", "entity_name", "storage"]
};

export default function JsonSchemaForm3() {
   const { schema, config } = useBknd();

   return (
      <Scrollable>
         <div className="flex flex-col p-3">
            {/*<Form
               schema={{
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
               }}
               className="flex flex-col gap-3"
            >
               <Field name="name" />
               <Field name="age" />
               <Field name="gender" />
               <Field name="deep" />
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
               initialValues={{ tags: [0, 1] }}
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

            <CustomMediaForm />
            <Form schema={schema.media} initialValues={config.media} />

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
   const ctx = useAnyOfContext();

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
