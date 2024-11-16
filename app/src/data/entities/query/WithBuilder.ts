import type { Entity, EntityManager, RepositoryQB } from "../../entities";

export class WithBuilder {
   private static buildClause(
      em: EntityManager<any>,
      qb: RepositoryQB,
      entity: Entity,
      withString: string
   ) {
      const relation = em.relationOf(entity.name, withString);
      if (!relation) {
         throw new Error(`Relation "${withString}" not found`);
      }

      const cardinality = relation.ref(withString).cardinality;
      //console.log("with--builder", { entity: entity.name, withString, cardinality });

      const fns = em.connection.fn;
      const jsonFrom = cardinality === 1 ? fns.jsonObjectFrom : fns.jsonArrayFrom;

      if (!jsonFrom) {
         throw new Error("Connection does not support jsonObjectFrom/jsonArrayFrom");
      }

      try {
         return relation.buildWith(entity, qb, jsonFrom, withString);
      } catch (e) {
         throw new Error(`Could not build "with" relation "${withString}": ${(e as any).message}`);
      }
   }

   static addClause(em: EntityManager<any>, qb: RepositoryQB, entity: Entity, withs: string[]) {
      if (withs.length === 0) return qb;

      let newQb = qb;
      for (const entry of withs) {
         newQb = WithBuilder.buildClause(em, newQb, entity, entry);
      }

      return newQb;
   }
}
