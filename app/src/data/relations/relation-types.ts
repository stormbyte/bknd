export const RelationTypes = {
   OneToOne: "1:1",
   ManyToOne: "n:1",
   ManyToMany: "m:n",
   Polymorphic: "poly",
} as const;
export type RelationType = (typeof RelationTypes)[keyof typeof RelationTypes];
