import {
   type EntityRelation,
   type EntityRelationAnchor,
   type ManyToOneRelation,
   type OneToOneRelation,
   RelationTypes,
} from "../relations";

export const MutationOperations = ["$set", "$create", "$attach", "$detach"] as const;
export type MutationOperation = (typeof MutationOperations)[number];

export class RelationHelper {
   relation: EntityRelation;
   access: "source" | "target";
   self: EntityRelationAnchor;
   other: EntityRelationAnchor;

   constructor(relation: EntityRelation, entity_name: string) {
      this.relation = relation;

      if (relation.source.entity.name === entity_name) {
         this.access = "source";
         this.self = relation.source;
         this.other = relation.target;
      } else if (relation.target.entity.name === entity_name) {
         this.access = "target";
         this.self = relation.target;
         this.other = relation.source;
      } else {
         throw new Error(
            `Entity "${entity_name}" is not part of the relation ` +
               `"${relation.source.entity.name} <-> ${relation.target.entity.name}"`,
         );
      }
   }

   // @todo: add to respective relations
   getMutationInfo() {
      const ops: Record<MutationOperation, boolean> = {
         $set: false,
         $create: false,
         $attach: false,
         $detach: false,
      };

      let local_field: string | undefined;
      let primary: string | undefined;

      switch (this.relation.type()) {
         case RelationTypes.ManyToOne:
            // only if owning side (source), target is always single (just to assure)
            if (typeof this.self.cardinality === "undefined" && this.other.cardinality === 1) {
               ops.$set = true;
               local_field = (this.relation as ManyToOneRelation).getField()?.name;
               primary = this.other.entity.getPrimaryField().name;
            }

            break;
         case RelationTypes.OneToOne:
            // only if owning side (source)
            if (this.access === "source") {
               ops.$create = true;
               ops.$set = true; // @todo: for now allow
               local_field = (this.relation as OneToOneRelation).getField()?.name;
               primary = this.other.entity.getPrimaryField().name;
            }
            break;
         case RelationTypes.ManyToMany:
            if (this.access === "source") {
               ops.$attach = true;
               ops.$detach = true;
               primary = this.other.entity.getPrimaryField().name;
            }
            break;
      }

      return {
         reference: this.other.reference,
         local_field,
         ...ops,
         primary,
         cardinality: this.other.cardinality,
         relation_type: this.relation.type(),
      };
   }
}
