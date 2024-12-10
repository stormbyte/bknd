import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Select, Switch, TextInput } from "@mantine/core";
import { TypeRegistry } from "@sinclair/typebox";
import {
   type Static,
   StringEnum,
   StringIdentifier,
   Type,
   registerCustomTypeboxKinds
} from "core/utils";
import { ManyToOneRelation, type RelationType, RelationTypes } from "data";
import { type ReactNode, useEffect } from "react";
import { type Control, type FieldValues, type UseFormRegister, useForm } from "react-hook-form";
import { useBknd } from "ui/client/bknd";
import { MantineNumberInput } from "ui/components/form/hook-form-mantine/MantineNumberInput";
import { MantineSelect } from "ui/components/form/hook-form-mantine/MantineSelect";
import { useStepContext } from "ui/components/steps/Steps";
import { ModalBody, ModalFooter, type TCreateModalSchema } from "./CreateModal";

// @todo: check if this could become an issue
registerCustomTypeboxKinds(TypeRegistry);

const Relations: {
   type: RelationType;
   label: string;
   component: (props: ComponentCtx<any>) => ReactNode;
}[] = [
   {
      type: RelationTypes.ManyToOne,
      label: "Many to One",
      component: ManyToOne
   },
   {
      type: RelationTypes.OneToOne,
      label: "One to One",
      component: OneToOne
   },
   {
      type: RelationTypes.ManyToMany,
      label: "Many to Many",
      component: ManyToMany
   },
   {
      type: RelationTypes.Polymorphic,
      label: "Polymorphic",
      component: Polymorphic
   }
];

const schema = Type.Object({
   type: StringEnum(Relations.map((r) => r.type)),
   source: StringIdentifier,
   target: StringIdentifier,
   config: Type.Object({})
});

type ComponentCtx<T extends FieldValues = FieldValues> = {
   register: UseFormRegister<T>;
   control: Control<T>;
   data: T;
};

export function StepRelation() {
   const { config } = useBknd();
   const entities = config.data.entities;
   const { nextStep, stepBack, state, setState } = useStepContext<TCreateModalSchema>();
   const {
      register,
      handleSubmit,
      formState: { isValid },
      setValue,
      watch,
      control
   } = useForm({
      resolver: typeboxResolver(schema),
      defaultValues: (state.relations?.create?.[0] ?? {}) as Static<typeof schema>
   });
   const data = watch();
   console.log("data", { data, schema });

   function handleNext() {
      if (isValid) {
         setState((prev) => {
            return {
               ...prev,
               relations: {
                  create: [data]
               }
            };
         });
         console.log("data", data);
         nextStep("create")();
      }
   }

   return (
      <>
         <form onSubmit={handleSubmit(handleNext)}>
            <ModalBody>
               <div className="grid grid-cols-3 gap-8">
                  <MantineSelect
                     control={control}
                     name="source"
                     label="Source"
                     allowDeselect={false}
                     data={Object.entries(entities ?? {}).map(([name, entity]) => ({
                        value: name,
                        label: entity.config?.name ?? name,
                        disabled: data.target === name
                     }))}
                  />
                  <MantineSelect
                     control={control}
                     name="type"
                     onChange={() => setValue("config", {})}
                     label="Relation Type"
                     data={Relations.map((r) => ({ value: r.type, label: r.label }))}
                     allowDeselect={false}
                  />
                  <MantineSelect
                     control={control}
                     allowDeselect={false}
                     name="target"
                     label="Target"
                     data={Object.entries(entities ?? {}).map(([name, entity]) => ({
                        value: name,
                        label: entity.config?.name ?? name,
                        disabled: data.source === name
                     }))}
                  />
               </div>

               <div>
                  {data.type &&
                     Relations.find((r) => r.type === data.type)?.component({
                        register,
                        control,
                        data
                     })}
               </div>
            </ModalBody>
            <ModalFooter
               next={{
                  type: "submit",
                  disabled: !isValid,
                  onClick: handleNext
               }}
               prev={{ onClick: stepBack }}
               debug={{ state, data }}
            />
         </form>
      </>
   );
}

const Pre = ({ children }: { children: ReactNode }) => (
   <b className="font-mono select-text">{children}</b>
);

const Callout = ({ children }: { children: ReactNode }) => (
   <div className="bg-primary/5 py-4 px-5 rounded-lg mt-10">{children}</div>
);

function ManyToOne({ register, control, data: { source, target, config } }: ComponentCtx) {
   return (
      <>
         <div className="grid grid-cols-3 gap-8">
            <div className="flex flex-col gap-4">
               <TextInput
                  label="Target mapping"
                  {...register("config.mappedBy")}
                  placeholder={target}
               />

               <MantineNumberInput
                  label="Cardinality"
                  name="config.sourceCardinality"
                  control={control}
                  placeholder="n"
               />
               <MantineNumberInput
                  label="WITH limit"
                  name="config.with_limit"
                  control={control}
                  placeholder={String(ManyToOneRelation.DEFAULTS.with_limit)}
               />
            </div>
            <div />
            <div className="flex flex-col gap-4">
               <TextInput
                  label="Source mapping"
                  {...register("config.inversedBy")}
                  placeholder={source}
               />
               <Switch label="Required" {...register("config.required")} />
            </div>
         </div>
         {source && target && config && (
            <Callout>
               <>
                  <p>
                     Many <Pre>{source}</Pre> will each have one reference to <Pre>{target}</Pre>.
                  </p>
                  <p>
                     A property <Pre>{config.mappedBy || target}_id</Pre> will be added to{" "}
                     <Pre>{source}</Pre> (which references <Pre>{target}</Pre>).
                  </p>
                  <p>
                     When creating <Pre>{source}</Pre>, a reference to <Pre>{target}</Pre> is{" "}
                     <i>{config.required ? "required" : "optional"}</i>.
                  </p>
                  {config.sourceCardinality ? (
                     <p>
                        <Pre>{source}</Pre> should not have more than{" "}
                        <Pre>{config.sourceCardinality}</Pre> referencing entr
                        {config.sourceCardinality === 1 ? "y" : "ies"} to <Pre>{source}</Pre>.
                     </p>
                  ) : null}
               </>
            </Callout>
         )}
      </>
   );
}

function OneToOne({
   register,
   control,
   data: {
      source,
      target,
      config: { mappedBy, required }
   }
}: ComponentCtx) {
   return (
      <>
         <div className="grid grid-cols-3 gap-8">
            <div className="flex flex-col gap-4">
               <TextInput
                  label="Target mapping"
                  {...register("config.mappedBy")}
                  placeholder={target}
               />
               <Switch label="Required" {...register("config.required")} />
            </div>
            <div />
            <div className="flex flex-col gap-4">
               <TextInput
                  label="Source mapping"
                  {...register("config.inversedBy")}
                  placeholder={source}
               />
            </div>
         </div>
         {source && target && (
            <Callout>
               <>
                  <p>
                     A single entry of <Pre>{source}</Pre> will have a reference to{" "}
                     <Pre>{target}</Pre>.
                  </p>
                  <p>
                     A property <Pre>{mappedBy || target}_id</Pre> will be added to{" "}
                     <Pre>{source}</Pre> (which references <Pre>{target}</Pre>).
                  </p>
                  <p>
                     When creating <Pre>{source}</Pre>, a reference to <Pre>{target}</Pre> is{" "}
                     <i>{required ? "required" : "optional"}</i>.
                  </p>
               </>
            </Callout>
         )}
      </>
   );
}

function ManyToMany({ register, control, data: { source, target, config } }: ComponentCtx) {
   const table = config.connectionTable
      ? config.connectionTable
      : source && target
        ? `${source}_${target}`
        : "";
   return (
      <>
         <div className="grid grid-cols-3 gap-8">
            <div className="flex flex-col gap-4">
               {/*<TextInput
                  label="Target mapping"
                  {...register("config.mappedBy")}
                  placeholder={target}
               />*/}
            </div>
            <div className="flex flex-col gap-4">
               <TextInput
                  label="Connection Table"
                  {...register("config.connectionTable")}
                  placeholder={table}
               />
               <TextInput
                  label="Connection Mapping"
                  {...register("config.connectionTableMappedName")}
                  placeholder={table}
               />
            </div>
            <div className="flex flex-col gap-4">
               {/*<TextInput
                  label="Source mapping"
                  {...register("config.inversedBy")}
                  placeholder={source}
               />*/}
            </div>
         </div>
         {source && target && (
            <Callout>
               <>
                  <p>
                     Many <Pre>{source}</Pre> will have many <Pre>{target}</Pre>.
                  </p>
                  <p>
                     A connection table <Pre>{table}</Pre> will be created to store the relations.
                  </p>
               </>
            </Callout>
         )}
      </>
   );
}

function Polymorphic({ register, control, data: { type, source, target, config } }: ComponentCtx) {
   return (
      <>
         <div className="grid grid-cols-3 gap-8" key={type}>
            <div className="flex flex-col gap-4">
               <TextInput
                  label="Target mapping"
                  {...register("config.mappedBy")}
                  placeholder={target}
               />
            </div>
            <div />
            <div className="flex flex-col gap-4">
               <TextInput
                  label="Source mapping"
                  {...register("config.inversedBy")}
                  placeholder={source}
               />
               <MantineNumberInput
                  label="Cardinality"
                  name="config.targetCardinality"
                  control={control}
                  placeholder="n"
               />
            </div>
         </div>
         {source && target && (
            <Callout>
               <>
                  <p>
                     <Pre>{source}</Pre> will have many <Pre>{target}</Pre>.
                  </p>
                  <p>
                     <Pre>{target}</Pre> will get additional properties <Pre>reference</Pre> and{" "}
                     <Pre>entity_id</Pre> to make the (polymorphic) reference.
                  </p>
                  {config.targetCardinality ? (
                     <p>
                        <Pre>{source}</Pre> should not have more than{" "}
                        <Pre>{config.targetCardinality}</Pre> reference
                        {config.targetCardinality === 1 ? "" : "s"} to <Pre>{target}</Pre>.
                     </p>
                  ) : null}
               </>
            </Callout>
         )}
      </>
   );
}
