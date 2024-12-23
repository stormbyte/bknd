import { EventManager } from "core/events";
import { sql } from "kysely";
import { Connection } from "../connection/Connection";
import {
   EntityNotDefinedException,
   TransformRetrieveFailedException,
   UnableToConnectException
} from "../errors";
import { MutatorEvents, RepositoryEvents } from "../events";
import type { EntityIndex } from "../fields/indices/EntityIndex";
import type { EntityRelation } from "../relations";
import { RelationAccessor } from "../relations/RelationAccessor";
import { SchemaManager } from "../schema/SchemaManager";
import { Entity } from "./Entity";
import { type EntityData, Mutator, Repository } from "./index";

type EntitySchema<E extends Entity | string, DB = any> = E extends Entity<infer Name>
   ? Name extends keyof DB
      ? Name
      : never
   : E extends keyof DB
     ? E
     : never;

export class EntityManager<DB> {
   connection: Connection;

   private _entities: Entity[] = [];
   private _relations: EntityRelation[] = [];
   private _indices: EntityIndex[] = [];
   private _schema?: SchemaManager;
   readonly emgr: EventManager<typeof EntityManager.Events>;
   static readonly Events = { ...MutatorEvents, ...RepositoryEvents };

   constructor(
      entities: Entity[],
      connection: Connection,
      relations: EntityRelation[] = [],
      indices: EntityIndex[] = [],
      emgr?: EventManager<any>
   ) {
      // add entities & relations
      entities.forEach((entity) => this.addEntity(entity));
      relations.forEach((relation) => this.addRelation(relation));
      indices.forEach((index) => this.addIndex(index));

      if (!Connection.isConnection(connection)) {
         throw new UnableToConnectException("");
      }

      this.connection = connection;
      this.emgr = emgr ?? new EventManager();
      //console.log("registering events", EntityManager.Events);
      this.emgr.registerEvents(EntityManager.Events);
   }

   /**
    * Forks the EntityManager without the EventManager.
    * This is useful when used inside an event handler.
    */
   fork(): EntityManager<DB> {
      return new EntityManager(this._entities, this.connection, this._relations, this._indices);
   }

   get entities(): Entity[] {
      return this._entities;
   }

   get relations(): RelationAccessor {
      return new RelationAccessor(this._relations);
   }

   get indices(): EntityIndex[] {
      return this._indices;
   }

   async ping(): Promise<boolean> {
      const res = await sql`SELECT 1`.execute(this.connection.kysely);
      return res.rows.length > 0;
   }

   addEntity(entity: Entity) {
      const existing = this.entities.find((e) => e.name === entity.name);
      // check if already exists by name
      if (existing) {
         // @todo: for now adding a graceful method
         if (JSON.stringify(existing) === JSON.stringify(entity)) {
            //console.warn(`Entity "${entity.name}" already exists, but it's the same, so skipping.`);
            return;
         }

         throw new Error(`Entity "${entity.name}" already exists`);
      }

      this.entities.push(entity);
   }

   entity(e: Entity | string): Entity {
      let entity: Entity | undefined;
      if (typeof e === "string") {
         entity = this.entities.find((entity) => entity.name === e);
      } else {
         entity = e;
      }

      if (!entity) {
         throw new EntityNotDefinedException(typeof e === "string" ? e : e.name);
      }

      return entity;
   }

   hasEntity(entity: string): boolean;
   hasEntity(entity: Entity): boolean;
   hasEntity(nameOrEntity: string | Entity): boolean {
      const name = typeof nameOrEntity === "string" ? nameOrEntity : nameOrEntity.name;
      return this.entities.some((e) => e.name === name);
   }

   hasIndex(index: string): boolean;
   hasIndex(index: EntityIndex): boolean;
   hasIndex(nameOrIndex: string | EntityIndex): boolean {
      const name = typeof nameOrIndex === "string" ? nameOrIndex : nameOrIndex.name;
      return this.indices.some((e) => e.name === name);
   }

   addRelation(relation: EntityRelation) {
      // check if entities are registered
      if (!this.entity(relation.source.entity.name) || !this.entity(relation.target.entity.name)) {
         throw new Error("Relation source or target entity not found");
      }

      // @todo: potentially add name to relation in order to have multiple
      const found = this._relations.find((r) => {
         const equalSourceTarget =
            r.source.entity.name === relation.source.entity.name &&
            r.target.entity.name === relation.target.entity.name;
         const equalReferences =
            r.source.reference === relation.source.reference &&
            r.target.reference === relation.target.reference;

         return (
            //r.type === relation.type && // ignore type for now
            equalSourceTarget && equalReferences
         );
      });

      if (found) {
         throw new Error(
            `Relation "${relation.type}" between "${relation.source.entity.name}" ` +
               `and "${relation.target.entity.name}" already exists`
         );
      }

      this._relations.push(relation);
      relation.initialize(this);
   }

   relationsOf(entity_name: string): EntityRelation[] {
      return this.relations.relationsOf(this.entity(entity_name));
   }

   relationOf(entity_name: string, reference: string): EntityRelation | undefined {
      return this.relations.relationOf(this.entity(entity_name), reference);
   }

   hasRelations(entity_name: string): boolean {
      return this.relations.hasRelations(this.entity(entity_name));
   }

   relatedEntitiesOf(entity_name: string): Entity[] {
      return this.relations.relatedEntitiesOf(this.entity(entity_name));
   }

   relationReferencesOf(entity_name: string): string[] {
      return this.relations.relationReferencesOf(this.entity(entity_name));
   }

   repository<E extends Entity | string>(entity: E): Repository<DB, EntitySchema<E, DB>> {
      return this.repo(entity);
   }

   repo<E extends Entity | string>(entity: E): Repository<DB, EntitySchema<E, DB>> {
      return new Repository(this, this.entity(entity), this.emgr);
   }

   mutator<E extends Entity | string>(entity: E): Mutator<DB, EntitySchema<E, DB>> {
      return new Mutator(this, this.entity(entity), this.emgr);
   }

   addIndex(index: EntityIndex, force = false) {
      // check if already exists by name
      if (this.indices.find((e) => e.name === index.name)) {
         if (force) {
            throw new Error(`Index "${index.name}" already exists`);
         }
         return;
      }

      this._indices.push(index);
   }

   getIndicesOf(_entity: Entity | string): EntityIndex[] {
      const entity = _entity instanceof Entity ? _entity : this.entity(_entity);
      return this.indices.filter((index) => index.entity.name === entity.name);
   }

   schema() {
      if (!this._schema) {
         this._schema = new SchemaManager(this);
      }

      return this._schema;
   }

   // @todo: centralize and add tests
   hydrate(entity_name: string, _data: EntityData[]) {
      const entity = this.entity(entity_name);
      const data: EntityData[] = [];

      for (const row of _data) {
         for (let [key, value] of Object.entries(row)) {
            const field = entity.getField(key);

            if (!field || field.isVirtual()) {
               // if relation, use related entity to hydrate
               const relation = this.relationOf(entity_name, key);
               if (relation) {
                  if (!value) continue;

                  value = relation.hydrate(key, Array.isArray(value) ? value : [value], this);
                  row[key] = value;
                  continue;
               } else if (field?.isVirtual()) {
                  continue;
               }

               throw new Error(`Field "${key}" not found on entity "${entity.name}"`);
            }

            try {
               if (value === null && field.hasDefault()) {
                  row[key] = field.getDefault();
               }

               row[key] = field.transformRetrieve(value as any);
            } catch (e: any) {
               throw new TransformRetrieveFailedException(
                  `"${field.type}" field "${key}" on entity "${entity.name}": ${e.message}`
               );
            }
         }

         data.push(row);
      }

      return data;
   }

   toJSON() {
      return {
         entities: Object.fromEntries(this.entities.map((e) => [e.name, e.toJSON()])),
         relations: Object.fromEntries(this.relations.all.map((r) => [r.getName(), r.toJSON()])),
         //relations: this.relations.all.map((r) => r.toJSON()),
         indices: Object.fromEntries(this.indices.map((i) => [i.name, i.toJSON()]))
      };
   }
}
