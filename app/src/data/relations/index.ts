import { ManyToManyRelation, type ManyToManyRelationConfig } from "./ManyToManyRelation";
import { ManyToOneRelation, type ManyToOneRelationConfig } from "./ManyToOneRelation";
import { OneToOneRelation, type OneToOneRelationConfig } from "./OneToOneRelation";
import { PolymorphicRelation, type PolymorphicRelationConfig } from "./PolymorphicRelation";
import { type RelationType, RelationTypes } from "./relation-types";

export * from "./EntityRelation";
export * from "./EntityRelationAnchor";
export * from "./RelationHelper";
export * from "./RelationMutator";
export * from "./RelationAccessor";

import {
   RelationField,
   type RelationFieldBaseConfig,
   type RelationFieldConfig,
   relationFieldConfigSchema,
} from "./RelationField";

export {
   OneToOneRelation,
   type OneToOneRelationConfig,
   ManyToOneRelation,
   type ManyToOneRelationConfig,
   ManyToManyRelation,
   type ManyToManyRelationConfig,
   PolymorphicRelation,
   type PolymorphicRelationConfig,
   RelationTypes,
   type RelationType,
   // field
   RelationField,
   relationFieldConfigSchema,
   type RelationFieldBaseConfig,
   type RelationFieldConfig,
};

export const RelationClassMap = {
   [RelationTypes.OneToOne]: { schema: OneToOneRelation.schema, cls: OneToOneRelation },
   [RelationTypes.ManyToOne]: { schema: ManyToOneRelation.schema, cls: ManyToOneRelation },
   [RelationTypes.ManyToMany]: { schema: ManyToManyRelation.schema, cls: ManyToManyRelation },
   [RelationTypes.Polymorphic]: {
      schema: PolymorphicRelation.schema,
      cls: PolymorphicRelation,
   },
} as const;

export const RelationFieldClassMap = {
   relation: { schema: relationFieldConfigSchema, field: RelationField },
} as const;
