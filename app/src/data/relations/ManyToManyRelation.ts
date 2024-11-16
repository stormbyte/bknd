import { type Static, Type } from "core/utils";
import { Entity, type EntityManager } from "../entities";
import { type Field, PrimaryField, VirtualField } from "../fields";
import type { RepoQuery } from "../server/data-query-impl";
import { EntityRelation, type KyselyJsonFrom, type KyselyQueryBuilder } from "./EntityRelation";
import { EntityRelationAnchor } from "./EntityRelationAnchor";
import { RelationField } from "./RelationField";
import { type RelationType, RelationTypes } from "./relation-types";

export type ManyToManyRelationConfig = Static<typeof ManyToManyRelation.schema>;

export class ManyToManyRelation extends EntityRelation<typeof ManyToManyRelation.schema> {
   connectionEntity: Entity;
   additionalFields: Field[] = [];
   connectionTableMappedName: string;
   private em?: EntityManager<any>;

   static override schema = Type.Composite(
      [
         EntityRelation.schema,
         Type.Object({
            connectionTable: Type.Optional(Type.String()),
            connectionTableMappedName: Type.Optional(Type.String())
         })
      ],
      {
         additionalProperties: false
      }
   );

   constructor(
      source: Entity,
      target: Entity,
      config?: ManyToManyRelationConfig,
      additionalFields?: Field[]
   ) {
      const connectionTable =
         config?.connectionTable || ManyToManyRelation.defaultConnectionTable(source, target);

      const sourceAnchor = new EntityRelationAnchor(source, source.name);
      const targetAnchor = new EntityRelationAnchor(target, target.name);
      super(sourceAnchor, targetAnchor, config);

      this.connectionEntity = new Entity(connectionTable, additionalFields, undefined, "generated");

      this.connectionTableMappedName = config?.connectionTableMappedName || connectionTable;
      this.additionalFields = additionalFields || [];
      //this.connectionTable = connectionTable;
   }

   static defaultConnectionTable(source: Entity, target: Entity) {
      return `${source.name}_${target.name}`;
   }

   type(): RelationType {
      return RelationTypes.ManyToMany;
   }

   /**
    * Many to many is always listable in both directions
    */
   override isListableFor(): boolean {
      return true;
   }

   getField(entity: Entity): RelationField {
      const conn = this.connectionEntity;
      const selfField = conn.fields.find(
         (f) => f instanceof RelationField && f.target() === entity.name
      )!;

      if (!selfField || !(selfField instanceof RelationField)) {
         throw new Error(
            `Connection entity "${conn.name}" does not have a relation to "${entity.name}"`
         );
      }

      return selfField;
   }

   private getQueryInfo(entity: Entity) {
      const other = this.other(entity);
      const conn = this.connectionEntity;
      const entityField = this.getField(entity);
      const otherField = this.getField(other.entity);
      const join = [
         conn.name,
         `${other.entity.name}.${other.entity.getPrimaryField().name}`,
         `${conn.name}.${otherField.name}`
      ] as const;

      const entityRef = `${entity.name}.${entity.getPrimaryField().name}`;
      const otherRef = `${conn.name}.${entityField.name}`;

      const groupBy = `${entity.name}.${entity.getPrimaryField().name}`;

      return {
         other,
         join,
         entityRef,
         otherRef,
         groupBy
      };
   }

   override getReferenceQuery(entity: Entity, id: number): Partial<RepoQuery> {
      const conn = this.connectionEntity;

      return {
         where: {
            [`${conn.name}.${entity.name}_${entity.getPrimaryField().name}`]: id
         },
         join: [this.target.reference]
      };
   }

   buildJoin(entity: Entity, qb: KyselyQueryBuilder) {
      const { other, join, entityRef, otherRef, groupBy } = this.getQueryInfo(entity);

      return qb
         .innerJoin(other.entity.name, entityRef, otherRef)
         .innerJoin(...join)
         .groupBy(groupBy);
   }

   buildWith(entity: Entity, qb: KyselyQueryBuilder, jsonFrom: KyselyJsonFrom) {
      if (!this.em) {
         throw new Error("EntityManager not set, can't build");
      }
      const jsonBuildObject = this.em.connection.fn.jsonBuildObject;
      if (!jsonBuildObject) {
         throw new Error("Connection does not support jsonBuildObject");
      }

      const limit = 5;
      const { other, join, entityRef, otherRef } = this.getQueryInfo(entity);
      const additionalFields = this.connectionEntity.fields.filter(
         (f) => !(f instanceof RelationField || f instanceof PrimaryField)
      );

      return qb.select((eb) => {
         const select: any[] = other.entity.getSelect(other.entity.name);
         // @todo: also add to find by references
         if (additionalFields.length > 0) {
            const conn = this.connectionEntity.name;
            select.push(
               jsonBuildObject(
                  Object.fromEntries(
                     additionalFields.map((f) => [f.name, eb.ref(`${conn}.${f.name}`)])
                  )
               ).as(this.connectionTableMappedName)
            );
         }

         return jsonFrom(
            eb
               .selectFrom(other.entity.name)
               .select(select)
               .whereRef(entityRef, "=", otherRef)
               .innerJoin(...join)
               .limit(limit)
         ).as(other.reference);
      });
   }

   initialize(em: EntityManager<any>) {
      this.em = em;

      //this.connectionEntity.addField(new RelationField(this.source.entity));
      //this.connectionEntity.addField(new RelationField(this.target.entity));
      this.connectionEntity.addField(RelationField.create(this, this.source));
      this.connectionEntity.addField(RelationField.create(this, this.target));

      // @todo: check this
      for (const field of this.additionalFields) {
         this.source.entity.addField(new VirtualField(this.connectionTableMappedName));
         this.target.entity.addField(new VirtualField(this.connectionTableMappedName));
      }

      em.addEntity(this.connectionEntity);
   }

   override getName(): string {
      return [
         super.getName(),
         [this.connectionEntity.name, this.connectionTableMappedName].filter(Boolean)
      ].join("_");
   }
}
