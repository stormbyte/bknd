import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Select, Switch, Tabs, TextInput, Textarea, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Type } from "@sinclair/typebox";
import { StringEnum, StringIdentifier, transformObject } from "core/utils";
import { FieldClassMap } from "data";
import { omit } from "lodash-es";
import {
   type FieldArrayWithId,
   type FieldValues,
   type UseControllerProps,
   type UseFormReturn,
   useController,
   useFieldArray,
   useForm
} from "react-hook-form";
import { TbChevronDown, TbChevronUp, TbGripVertical, TbTrash } from "react-icons/tb";
import { Button } from "../../../components/buttons/Button";
import { IconButton } from "../../../components/buttons/IconButton";
import { MantineSelect } from "../../../components/form/hook-form-mantine/MantineSelect";

const fieldSchemas = transformObject(omit(FieldClassMap, ["primary"]), (value) => value.schema);
const fieldSchema = Type.Union(
   Object.entries(fieldSchemas).map(([type, schema]) =>
      Type.Object(
         {
            type: Type.Const(type),
            name: StringIdentifier,
            config: Type.Optional(schema)
         },
         {
            additionalProperties: false
         }
      )
   )
);
const schema = Type.Object({
   fields: Type.Array(fieldSchema)
});

const fieldSchema2 = Type.Object({
   type: StringEnum(Object.keys(fieldSchemas)),
   name: StringIdentifier
});

function specificFieldSchema(type: keyof typeof fieldSchemas) {
   return Type.Omit(fieldSchemas[type], [
      "label",
      "description",
      "required",
      "fillable",
      "hidden",
      "virtual"
   ]);
}

export default function EntityFieldsForm() {
   const {
      control,
      formState: { isValid, errors },
      getValues,
      handleSubmit,
      watch,
      register,
      setValue
   } = useForm({
      mode: "onTouched",
      resolver: typeboxResolver(schema),
      defaultValues: {
         fields: [{ type: "text", name: "", config: {} }],
         sort: { by: "-1", dir: "asc" }
      }
   });
   const defaultType = Object.keys(fieldSchemas)[0];
   const { fields, append, prepend, remove, swap, move, insert, update } = useFieldArray({
      control, // control props comes from useForm (optional: if you are using FormProvider)
      name: "fields" // unique name for your Field Array
   });

   function handleAppend() {
      append({ type: "text", name: "", config: {} });
   }

   return (
      <div className="flex flex-col gap-1 p-8">
         {/*{fields.map((field, index) => (
            <EntityField
               key={field.id}
               field={field}
               index={index}
               form={{ watch, register, setValue, getValues, control }}
               defaultType={defaultType}
               remove={remove}
            />
         ))}*/}
         {fields.map((field, index) => (
            <EntityFieldForm key={field.id} value={field} index={index} update={update} />
         ))}

         <Button className="justify-center" onClick={handleAppend}>
            Add Field
         </Button>

         <div>
            <pre>{JSON.stringify(watch(), null, 2)}</pre>
         </div>
      </div>
   );
}

function EntityFieldForm({ update, index, value }) {
   const {
      register,
      handleSubmit,
      control,
      formState: { errors }
   } = useForm({
      mode: "onBlur",
      resolver: typeboxResolver(
         Type.Object({
            type: StringEnum(Object.keys(fieldSchemas)),
            name: Type.String({ minLength: 1, maxLength: 3 })
         })
      ),
      defaultValues: value
   });

   function handleUpdate({ id, ...data }) {
      console.log("data", data);
      update(index, data);
   }

   return (
      <form>
         <MantineSelect
            control={control}
            name="type"
            data={[...Object.keys(fieldSchemas), "test"]}
         />
         <TextInput
            label="Name"
            placeholder="name"
            classNames={{ root: "w-full" }}
            {...register("name")}
            error={errors.name?.message as any}
         />
      </form>
   );
}

function EntityFieldController({
   name,
   control,
   defaultValue,
   rules,
   shouldUnregister
}: UseControllerProps & {
   index: number;
}) {
   const {
      field: { value, onChange: fieldOnChange, ...field },
      fieldState
   } = useController({
      name,
      control,
      defaultValue,
      rules,
      shouldUnregister
   });

   return <div>field</div>;
}

function EntityField({
   field,
   index,
   form: { watch, register, setValue, getValues, control },
   remove,
   defaultType
}: {
   field: FieldArrayWithId;
   index: number;
   form: Pick<UseFormReturn<any>, "watch" | "register" | "setValue" | "getValues" | "control">;
   remove: (index: number) => void;
   defaultType: string;
}) {
   const [opened, handlers] = useDisclosure(false);
   const prefix = `fields.${index}` as const;
   const name = watch(`${prefix}.name`);
   const enabled = name?.length > 0;
   const type = watch(`${prefix}.type`);
   //const config = watch(`${prefix}.config`);
   const selectFieldRegister = register(`${prefix}.type`);
   //console.log("type", type, specificFieldSchema(type as any));

   function handleDelete(index: number) {
      return () => {
         if (name.length === 0) {
            remove(index);
            return;
         }
         window.confirm(`Sure to delete "${name}"?`) && remove(index);
      };
   }

   return (
      <div key={field.id} className="flex flex-col border border-muted rounded">
         <div className="flex flex-row gap-2 px-2 pt-1 pb-2">
            <div className="flex items-center">
               <IconButton Icon={TbGripVertical} className="mt-1" />
            </div>
            <div className="flex flex-row flex-grow gap-1">
               <div>
                  <Select
                     label="Type"
                     data={[...Object.keys(fieldSchemas), "test"]}
                     defaultValue={defaultType}
                     onBlur={selectFieldRegister.onBlur}
                     onChange={(value) => {
                        setValue(`${prefix}.type`, value as any);
                        setValue(`${prefix}.config`, {} as any);
                     }}
                  />
               </div>
               <TextInput
                  label="Name"
                  placeholder="name"
                  classNames={{ root: "w-full" }}
                  {...register(`fields.${index}.name`)}
               />
            </div>
            <div className="flex items-end ">
               <div className="flex flex-row gap-1">
                  <Tooltip label="Specify a property name to see options." disabled={enabled}>
                     <Button
                        IconRight={opened ? TbChevronUp : TbChevronDown}
                        onClick={handlers.toggle}
                        variant={opened ? "default" : "ghost"}
                        disabled={!enabled}
                     >
                        Options
                     </Button>
                  </Tooltip>
                  <IconButton Icon={TbTrash} onClick={handleDelete(index)} />
               </div>
            </div>
         </div>
         {/*{enabled && opened && (
            <div className="flex flex-col border-t border-t-muted px-3 py-2">
               <Tabs defaultValue="general">
                  <Tabs.List>
                     <Tabs.Tab value="general">General</Tabs.Tab>
                     <Tabs.Tab value="specific">Specific</Tabs.Tab>
                     <Tabs.Tab value="visibility">Visiblity</Tabs.Tab>
                  </Tabs.List>
                  <Tabs.Panel value="general">
                     <div className="flex flex-col gap-2 pt-3 pb-1" key={`${prefix}_${type}`}>
                        <Switch
                           label="Required"
                           {...register(`${prefix}.config.required` as any)}
                        />
                        <TextInput
                           label="Label"
                           placeholder="Label"
                           {...register(`${prefix}.config.label` as any)}
                        />
                        <Textarea
                           label="Description"
                           placeholder="Description"
                           {...register(`${prefix}.config.description` as any)}
                        />
                        <Switch label="Virtual" {...register(`${prefix}.config.virtual` as any)} />
                     </div>
                  </Tabs.Panel>
                  <Tabs.Panel value="specific">
                     <div className="flex flex-col gap-2 pt-3 pb-1">
                        <JsonSchemaForm
                           key={type}
                           schema={specificFieldSchema(type as any)}
                           uiSchema={dataFieldsUiSchema.config}
                           className="legacy hide-required-mark fieldset-alternative mute-root"
                           onChange={(value) => {
                              setValue(`${prefix}.config`, {
                                 ...getValues([`fields.${index}.config`])[0],
                                 ...value
                              });
                           }}
                        />
                     </div>
                  </Tabs.Panel>
               </Tabs>
            </div>
         )}*/}
      </div>
   );
}
