import { DataProvider, usePlasmicCanvasContext } from "@plasmicapp/host";
import registerComponent, { type ComponentMeta } from "@plasmicapp/host/registerComponent";
import { usePlasmicQueryData } from "@plasmicapp/query";
import { useApi, useEntityQuery } from "bknd/client";
import type { RepoQuery } from "bknd/data";
// biome-ignore lint/style/useImportType: <explanation>
import React from "react";
import { usePlasmicBkndContext } from "../../contexts/BkndContext";

type BkndDataProps = {
   children?: React.ReactNode;
   loading?: React.ReactNode;
   error?: React.ReactNode;
   empty?: React.ReactNode;
   setControlContextData?: (ctxData: {
      entities: string[];
      fields: string[];
      references: string[];
   }) => void;
   className?: string;
   limit?: number;
   offset?: number;
   withRefs?: string[];
   joinRefs?: string[];
   dataName?: string;
   entityId?: number;
   entity?: string;
   select?: string[];
   sortBy: string;
   sortDir: "asc" | "desc";
   where?: string;
   mode?: "fetch" | "swr";
   noLayout?: boolean;
   preview?: boolean;
   previewSlot?: "loading" | "error" | "empty";
};

const LoadingComponent = ({ loading }: { loading?: React.ReactNode }) => {
   return loading ? <>{loading}</> : <>Loading...</>;
};

const ErrorComponent = ({ error }: { error?: React.ReactNode }) => {
   return error ? <>{error}</> : <>Error</>;
};

const EmptyComponent = ({ empty }: { empty?: React.ReactNode }) => {
   return empty ? <>{empty}</> : <>No data</>;
};

export function BkndData({
   children,
   loading,
   error,
   empty,
   entity,
   setControlContextData,
   dataName,
   limit,
   offset,
   entityId,
   where,
   withRefs,
   joinRefs,
   sortBy = "id",
   sortDir = "asc",
   mode = "fetch",
   select = [],
   noLayout,
   preview,
   previewSlot,
   ...props
}: BkndDataProps) {
   //console.log("--bknd data");
   const inEditor = !!usePlasmicCanvasContext();
   const plasmicContext = usePlasmicBkndContext();

   if (inEditor && preview) {
      let Component: React.ReactNode;
      switch (previewSlot) {
         case "loading":
            Component = <LoadingComponent loading={loading} />;
            break;
         case "error":
            Component = <ErrorComponent error={error} />;
            break;
         case "empty":
            Component = <EmptyComponent empty={empty} />;
            break;
      }

      if (Component) {
         return noLayout ? Component : <div className={props.className}>{Component}</div>;
      }
   }

   let _where: any = undefined;
   if (where) {
      if (typeof where === "string") {
         try {
            _where = JSON.parse(where);
         } catch (e) {}
      } else {
         _where = where;
      }
   }

   const query = {
      select: select.length > 0 ? select : undefined,
      limit: entityId ? undefined : limit,
      offset: entityId ? undefined : offset,
      where: _where,
      sort: { by: sortBy, dir: sortDir },
      with: withRefs,
      join: joinRefs
   };

   //console.log("---context", plasmicContext);
   if (plasmicContext.appConfig?.data?.entities) {
      const { entities, relations } = plasmicContext.appConfig.data;
      console.log("entities", entities);
      //setControlContextData?.({ entities, fields: ["id"] });

      let fields: string[] = ["id"];
      let references: string[] = [];

      if (entity && entity in entities) {
         fields = Object.keys(entities[entity].fields!);

         if (relations) {
            const rels = Object.values(relations).filter(
               // biome-ignore lint/suspicious/noDoubleEquals: <explanation>
               (r: any) => r.source == entity
            );
            // @ts-ignore
            references = rels?.map((r) => r.config?.mappedBy ?? r.target);
            //console.log("relations", relations, references);
         }
      }

      setControlContextData?.({ entities: Object.keys(entities), fields, references });
   }

   if (!entity) {
      return <div>Select an entity</div>;
   }

   const modeProps: ModeProps = {
      loading,
      error,
      empty,
      dataName: dataName ?? entity ?? "data",
      entityId,
      entity,
      query,
      children
   };

   const Component = mode === "swr" ? <ModeSWR {...modeProps} /> : <ModeFetch {...modeProps} />;
   return noLayout ? Component : <div className={props.className}>{Component}</div>;
}

type ModeProps = {
   entity: string;
   dataName: string;
   children?: React.ReactNode;
   loading?: React.ReactNode;
   error?: React.ReactNode;
   empty?: React.ReactNode;
   entityId?: number;
   query?: Partial<RepoQuery>;
};

const ModeFetch = ({
   children,
   loading,
   error,
   empty,
   dataName,
   entityId,
   entity,
   query
}: ModeProps) => {
   const api = useApi();
   const endpoint = entityId
      ? api.data.readOne(entity, entityId, query)
      : api.data.readMany(entity, query);

   const {
      data,
      error: hasError,
      isLoading
   } = usePlasmicQueryData(endpoint.key(), async () => {
      const res = await endpoint.execute();
      return res.data;
   });

   if (isLoading) {
      return <LoadingComponent loading={loading} />;
   }

   if (hasError) {
      return <ErrorComponent error={error} />;
   }

   if (data.length === 0) {
      return <EmptyComponent empty={empty} />;
   }

   return (
      <DataProvider name={dataName ?? entity ?? "data"} data={data}>
         {children}
      </DataProvider>
   );
};

const ModeSWR = ({ children, loading, error, dataName, entityId, empty, entity }: ModeProps) => {
   const $q = useEntityQuery(entity, entityId);

   if ($q.isLoading) {
      return <LoadingComponent loading={loading} />;
   }

   if ($q.error) {
      return <ErrorComponent error={error} />;
   }

   if (!$q.data) {
      return <EmptyComponent empty={empty} />;
   }

   return (
      <DataProvider name={dataName ?? entity ?? "data"} data={$q.data}>
         {children}
      </DataProvider>
   );
};

export function registerBkndData(
   loader?: { registerComponent: typeof registerComponent },
   customMeta?: ComponentMeta<BkndDataProps>
) {
   if (loader) {
      loader.registerComponent(BkndData, customMeta ?? BkndDataMeta);
   } else {
      registerComponent(BkndData, customMeta ?? BkndDataMeta);
   }
}

export const BkndDataMeta: ComponentMeta<BkndDataProps> = {
   name: "BKND Data",
   section: "BKND",
   importPath: "@bknd/plasmic",
   providesData: true,
   props: {
      entity: {
         type: "choice",
         options: (props, ctx) => ctx?.entities ?? []
      },
      dataName: {
         type: "string"
      },
      entityId: {
         type: "number"
      },
      select: {
         type: "choice",
         options: (props, ctx) => ctx?.fields ?? []
      },
      limit: {
         type: "number",
         defaultValue: 10,
         // @ts-ignore
         hidden: (props) => !!props.entityId,
         min: 0
      },
      offset: {
         type: "number",
         defaultValue: 0,
         // @ts-ignore
         hidden: (props) => !!props.entityId,
         min: 0
      },
      withRefs: {
         displayName: "With",
         type: "choice",
         multiSelect: true,
         options: (props, ctx) => ctx?.references ?? []
      },
      joinRefs: {
         displayName: "Join",
         type: "choice",
         multiSelect: true,
         options: (props, ctx) => ctx?.references ?? []
      },
      where: {
         type: "code",
         lang: "json"
      },
      sortBy: {
         type: "choice",
         options: (props, ctx) => ctx?.fields ?? []
      },
      sortDir: {
         type: "choice",
         options: ["asc", "desc"],
         defaultValue: "asc"
      },
      children: {
         type: "slot"
      },
      loading: {
         type: "slot"
      },
      error: {
         type: "slot"
      },
      empty: {
         type: "slot"
      },
      mode: {
         type: "choice",
         options: ["fetch", "swr"],
         defaultValue: "fetch",
         advanced: true
      },
      noLayout: {
         type: "boolean",
         defaultValue: true,
         advanced: true
      },
      preview: {
         type: "boolean",
         defaultValue: false,
         advanced: true
      },
      previewSlot: {
         type: "choice",
         options: ["loading", "error", "empty"],
         hidden: (props: any) => props.preview !== true,
         advanced: true
      }
   }
};
