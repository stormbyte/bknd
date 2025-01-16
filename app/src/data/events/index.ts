import type { PrimaryFieldType } from "core";
import { Event, InvalidEventReturn } from "core/events";
import type { Entity, EntityData } from "../entities";
import type { RepoQuery } from "../server/data-query-impl";

export class MutatorInsertBefore extends Event<{ entity: Entity; data: EntityData }, EntityData> {
   static override slug = "mutator-insert-before";

   override validate(data: EntityData) {
      const { entity } = this.params;
      if (!entity.isValidData(data, "create")) {
         throw new InvalidEventReturn("EntityData", "invalid");
      }

      return this.clone({
         entity,
         data
      });
   }
}
export class MutatorInsertAfter extends Event<{ entity: Entity; data: EntityData }> {
   static override slug = "mutator-insert-after";
}
export class MutatorUpdateBefore extends Event<
   {
      entity: Entity;
      entityId: PrimaryFieldType;
      data: EntityData;
   },
   EntityData
> {
   static override slug = "mutator-update-before";

   override validate(data: EntityData) {
      const { entity, ...rest } = this.params;
      if (!entity.isValidData(data, "update")) {
         throw new InvalidEventReturn("EntityData", "invalid");
      }

      return this.clone({
         ...rest,
         entity,
         data
      });
   }
}
export class MutatorUpdateAfter extends Event<{
   entity: Entity;
   entityId: PrimaryFieldType;
   data: EntityData;
}> {
   static override slug = "mutator-update-after";
}
export class MutatorDeleteBefore extends Event<{ entity: Entity; entityId: PrimaryFieldType }> {
   static override slug = "mutator-delete-before";
}
export class MutatorDeleteAfter extends Event<{
   entity: Entity;
   entityId: PrimaryFieldType;
   data: EntityData;
}> {
   static override slug = "mutator-delete-after";
}

export const MutatorEvents = {
   MutatorInsertBefore,
   MutatorInsertAfter,
   MutatorUpdateBefore,
   MutatorUpdateAfter,
   MutatorDeleteBefore,
   MutatorDeleteAfter
};

export class RepositoryFindOneBefore extends Event<{ entity: Entity; options: RepoQuery }> {
   static override slug = "repository-find-one-before";
}
export class RepositoryFindOneAfter extends Event<{
   entity: Entity;
   options: RepoQuery;
   data: EntityData;
}> {
   static override slug = "repository-find-one-after";
}

export class RepositoryFindManyBefore extends Event<{ entity: Entity; options: RepoQuery }> {
   static override slug = "repository-find-many-before";
   static another = "one";
}
export class RepositoryFindManyAfter extends Event<{
   entity: Entity;
   options: RepoQuery;
   data: EntityData;
}> {
   static override slug = "repository-find-many-after";
}

export const RepositoryEvents = {
   RepositoryFindOneBefore,
   RepositoryFindOneAfter,
   RepositoryFindManyBefore,
   RepositoryFindManyAfter
};
