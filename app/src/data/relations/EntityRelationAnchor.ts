import type { Entity } from "../entities";

export class EntityRelationAnchor {
   entity: Entity;
   cardinality?: number;

   /**
    * The name that the other entity will use to reference this entity
    */
   reference: string;

   constructor(entity: Entity, name: string, cardinality?: number) {
      this.entity = entity;
      this.cardinality = cardinality;
      this.reference = name;
   }

   toJSON() {
      return {
         entity: this.entity.name,
         cardinality: this.cardinality,
         name: this.reference,
      };
   }
}
