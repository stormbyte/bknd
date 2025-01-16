import { isObject } from "core/utils";
import type { KyselyJsonFrom, RepoQuery } from "data";
import { InvalidSearchParamsException } from "data/errors";
import type { RepoWithSchema } from "data/server/data-query-impl";
import type { Entity, EntityManager, RepositoryQB } from "../../entities";

export class WithBuilder {
   /*private static buildClause(
      em: EntityManager<any>,
      qb: RepositoryQB,
      entity: Entity,
      ref: string,
      config?: RepoQuery
   ) {
      const relation = em.relationOf(entity.name, withString);
      if (!relation) {
         throw new Error(`Relation "${withString}" not found`);
      }

      const cardinality = relation.ref(withString).cardinality;
      //console.log("with--builder", { entity: entity.name, withString, cardinality });

      const jsonFrom = cardinality === 1 ? fns.jsonObjectFrom : fns.jsonArrayFrom;

      if (!jsonFrom) {
         throw new Error("Connection does not support jsonObjectFrom/jsonArrayFrom");
      }

      try {
         return relation.buildWith(entity, qb, jsonFrom, withString);
      } catch (e) {
         throw new Error(`Could not build "with" relation "${withString}": ${(e as any).message}`);
      }
   }*/

   static addClause(
      em: EntityManager<any>,
      qb: RepositoryQB,
      entity: Entity,
      withs: RepoQuery["with"]
   ) {
      if (!withs || !isObject(withs)) {
         console.warn(`'withs' undefined or invalid, given: ${JSON.stringify(withs)}`);
         return qb;
      }

      const fns = em.connection.fn;
      let newQb = qb;

      for (const [ref, query] of Object.entries(withs)) {
         const relation = em.relationOf(entity.name, ref);
         if (!relation) {
            throw new Error(`Relation "${entity.name}<>${ref}" not found`);
         }
         const cardinality = relation.ref(ref).cardinality;
         const jsonFrom: KyselyJsonFrom =
            cardinality === 1 ? fns.jsonObjectFrom : fns.jsonArrayFrom;
         if (!jsonFrom) {
            throw new Error("Connection does not support jsonObjectFrom/jsonArrayFrom");
         }

         const alias = relation.other(entity).reference;
         newQb = newQb.select((eb) => {
            return jsonFrom(relation.buildWith(entity, ref)(eb)).as(alias);
         });
         //newQb = relation.buildWith(entity, qb, jsonFrom, ref);
      }

      return newQb;
   }

   static validateWiths(em: EntityManager<any>, entity: string, withs: RepoQuery["with"]) {
      let depth = 0;
      if (!withs || !isObject(withs)) {
         console.warn(`'withs' undefined or invalid, given: ${JSON.stringify(withs)}`);
         return depth;
      }

      const child_depths: number[] = [];
      for (const [ref, query] of Object.entries(withs)) {
         const related = em.relationOf(entity, ref);
         if (!related) {
            throw new InvalidSearchParamsException(
               `WITH: "${ref}" is not a relation of "${entity}"`
            );
         }
         depth++;

         if ("with" in query) {
            child_depths.push(WithBuilder.validateWiths(em, ref, query.with as any));
         }
      }
      if (child_depths.length > 0) {
         depth += Math.max(...child_depths);
      }

      return depth;
   }
}
