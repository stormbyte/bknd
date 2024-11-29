import type { FieldApi, FormApi } from "@tanstack/react-form";
import {
   type Entity,
   type EntityData,
   EnumField,
   type Field,
   JsonField,
   JsonSchemaField,
   RelationField
} from "data";
import { MediaField } from "media/MediaField";
import { type ComponentProps, Suspense } from "react";
import { useClient } from "ui/client";
import { JsonEditor } from "ui/components/code/JsonEditor";
import * as Formy from "ui/components/form/Formy";
import { FieldLabel } from "ui/components/form/Formy";
import { useEvent } from "ui/hooks/use-event";
import { Dropzone, type FileState } from "../../media/components/dropzone/Dropzone";
import { mediaItemsToFileStates } from "../../media/helper";
import { EntityJsonSchemaFormField } from "./fields/EntityJsonSchemaFormField";
import { EntityRelationalFormField } from "./fields/EntityRelationalFormField";

type EntityFormProps = {
   entity: Entity;
   entityId?: number;
   data?: EntityData;
   handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
   fieldsDisabled: boolean;
   Form: FormApi<any>;
   className?: string;
   action: "create" | "update";
};

export function EntityForm({
   entity,
   entityId,
   handleSubmit,
   fieldsDisabled,
   Form,
   data,
   className,
   action
}: EntityFormProps) {
   const fields = entity.getFillableFields(action, true);
   console.log("data", { data, fields });

   return (
      <form onSubmit={handleSubmit}>
         <Form.Subscribe
            selector={(state) => {
               //console.log("state", state);
               return [state.canSubmit, state.isValid, state.errors];
            }}
            children={([canSubmit, isValid, errors]) => {
               //console.log("form:state", { canSubmit, isValid, errors });
               return (
                  !isValid && (
                     <div className="flex flex-col dark:bg-red-950 bg-red-100 p-4">
                        <p>Form is invalid.</p>
                        {Array.isArray(errors) && (
                           <ul className="list-disc">
                              {errors.map((error, key) => (
                                 <li className="ml-6" key={key}>
                                    {error}
                                 </li>
                              ))}
                           </ul>
                        )}
                     </div>
                  )
               );
            }}
         />
         <div className={className}>
            {fields.map((field, key) => {
               // @todo: tanstack form re-uses the state, causes issues navigating between entities w/ same fields

               // media field needs to render outside of the form
               // as its value is not stored in the form state
               if (field instanceof MediaField) {
                  return (
                     <EntityMediaFormField
                        key={field.name + key}
                        entity={entity}
                        entityId={entityId}
                        formApi={Form}
                        field={field}
                     />
                  );
               }

               if (!field.isFillable(action)) {
                  return;
               }

               const _key = `${entity.name}-${field.name}-${key}`;

               return (
                  <Form.Field
                     key={_key}
                     name={field.name}
                     children={(props) => (
                        <EntityFormField
                           field={field}
                           fieldApi={props}
                           disabled={fieldsDisabled}
                           tabIndex={key + 1}
                           action={action}
                           data={data}
                        />
                     )}
                  />
               );
            })}
         </div>
         <div className="hidden">
            <button type="submit" />
         </div>
      </form>
   );
}

type EntityFormFieldProps<
   T extends keyof JSX.IntrinsicElements = "input",
   F extends Field = Field
> = ComponentProps<T> & {
   fieldApi: FieldApi<any, any>;
   field: F;
   action: "create" | "update";
   data?: EntityData;
};

type FormInputElement = HTMLInputElement | HTMLTextAreaElement;

function EntityFormField({ fieldApi, field, action, data, ...props }: EntityFormFieldProps) {
   const handleUpdate = useEvent((e: React.ChangeEvent<FormInputElement> | any) => {
      if (typeof e === "object" && "target" in e) {
         //console.log("handleUpdate", e.target.value);
         fieldApi.handleChange(e.target.value);
      } else {
         //console.log("handleUpdate-", e);
         fieldApi.handleChange(e);
      }
   });

   //const required = field.isRequired();
   //const customFieldProps = { ...props, action, required };

   if (field instanceof RelationField) {
      return (
         <EntityRelationalFormField
            fieldApi={fieldApi}
            field={field}
            data={data}
            disabled={props.disabled}
            tabIndex={props.tabIndex}
         />
      );
   }

   if (field instanceof JsonField) {
      return <EntityJsonFormField fieldApi={fieldApi} field={field} {...props} />;
   }

   if (field instanceof JsonSchemaField) {
      return (
         <EntityJsonSchemaFormField
            fieldApi={fieldApi}
            field={field}
            data={data}
            disabled={props.disabled}
            tabIndex={props.tabIndex}
            {...props}
         />
      );
   }

   if (field instanceof EnumField) {
      return <EntityEnumFormField fieldApi={fieldApi} field={field} {...props} />;
   }

   const fieldElement = field.getHtmlConfig().element;
   const fieldProps = field.getHtmlConfig().props as any;
   const Element = Formy.formElementFactory(fieldElement ?? "input", fieldProps);

   return (
      <Formy.Group>
         <FieldLabel htmlFor={fieldApi.name} field={field} />
         <Element
            {...fieldProps}
            name={fieldApi.name}
            id={fieldApi.name}
            value={fieldApi.state.value}
            onBlur={fieldApi.handleBlur}
            onChange={handleUpdate}
            required={field.isRequired()}
            {...props}
         />
      </Formy.Group>
   );
}

function EntityMediaFormField({
   formApi,
   field,
   entity,
   entityId,
   disabled
}: {
   formApi: FormApi<any>;
   field: MediaField;
   entity: Entity;
   entityId?: number;
   disabled?: boolean;
}) {
   if (!entityId) return;

   const client = useClient();
   const value = formApi.useStore((state) => {
      const val = state.values[field.name];
      if (!val || typeof val === "undefined") return [];
      if (Array.isArray(val)) return val;
      return [val];
   });

   const initialItems: FileState[] =
      value.length === 0
         ? []
         : mediaItemsToFileStates(value, {
              baseUrl: client.baseUrl,
              overrides: { state: "uploaded" }
           });

   const getUploadInfo = useEvent(() => {
      const api = client.media().api();
      return {
         url: api.getEntityUploadUrl(entity.name, entityId, field.name),
         headers: api.getUploadHeaders(),
         method: "POST"
      };
   });

   const handleDelete = useEvent(async (file) => {
      client.__invalidate(entity.name, entityId);
      return await client.media().deleteFile(file);
   });

   return (
      <Formy.Group>
         <FieldLabel field={field} />
         <Dropzone
            key={`${entity.name}-${entityId}-${field.name}-${value.length === 0 ? "initial" : "loaded"}`}
            getUploadInfo={getUploadInfo}
            handleDelete={handleDelete}
            initialItems={initialItems}
            maxItems={field.getMaxItems()}
            autoUpload
         />
      </Formy.Group>
   );
}

function EntityJsonFormField({
   fieldApi,
   field,
   ...props
}: { fieldApi: FieldApi<any, any>; field: JsonField }) {
   const handleUpdate = useEvent((value: any) => {
      fieldApi.handleChange(value);
   });

   return (
      <Formy.Group>
         <Formy.Label htmlFor={fieldApi.name}>{field.getLabel()}</Formy.Label>
         <Suspense>
            <JsonEditor
               id={fieldApi.name}
               value={fieldApi.state.value}
               onChange={handleUpdate}
               onBlur={fieldApi.handleBlur}
               minHeight="100"
               /*required={field.isRequired()}*/
               {...props}
            />
         </Suspense>
         {/*<Formy.Textarea
            name={fieldApi.name}
            id={fieldApi.name}
            value={fieldApi.state.value}
            onBlur={fieldApi.handleBlur}
            onChange={handleUpdate}
            required={field.isRequired()}
            {...props}
         />*/}
      </Formy.Group>
   );
}

function EntityEnumFormField({
   fieldApi,
   field,
   ...props
}: { fieldApi: FieldApi<any, any>; field: EnumField }) {
   const handleUpdate = useEvent((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      fieldApi.handleChange(e.target.value);
   });

   return (
      <Formy.Group>
         <Formy.Label htmlFor={fieldApi.name}>{field.getLabel()}</Formy.Label>
         <Formy.Select
            name={fieldApi.name}
            id={fieldApi.name}
            value={fieldApi.state.value}
            onBlur={fieldApi.handleBlur}
            onChange={handleUpdate as any}
            required={field.isRequired()}
            {...props}
         >
            {!field.isRequired() && <option value="">- Select -</option>}
            {field.getOptions().map((option) => (
               <option key={option.value} value={option.value}>
                  {option.label}
               </option>
            ))}
         </Formy.Select>
      </Formy.Group>
   );
}
