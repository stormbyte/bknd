import { describe, expect, test } from "bun:test";
import { MediaField } from "../../src";
import {
   BooleanField,
   DateField,
   Entity,
   EnumField,
   JsonField,
   ManyToManyRelation,
   ManyToOneRelation,
   NumberField,
   OneToOneRelation,
   PolymorphicRelation,
   TextField
} from "../../src/data";
import {
   FieldPrototype,
   type FieldSchema,
   type InsertSchema,
   type Schema,
   boolean,
   date,
   datetime,
   entity,
   enumm,
   json,
   media,
   medium,
   number,
   relation,
   text
} from "../../src/data/prototype";

describe("prototype", () => {
   test("...", () => {
      const fieldPrototype = new FieldPrototype("text", {}, false);
      //console.log("field", fieldPrototype, fieldPrototype.getField("name"));
      /*const user = entity("users", {
         name: text().required(),
         bio: text(),
         age: number(),
         some: number().required(),
      });

      console.log("user", user);*/
   });

   test("...2", async () => {
      const user = entity("users", {
         name: text().required(),
         bio: text(),
         age: number(),
         some: number().required()
      });

      //console.log("user", user.toJSON());
   });

   test("...3", async () => {
      const user = entity("users", {
         name: text({ default_value: "hello" }).required(),
         bio: text(),
         age: number(),
         some: number().required()
      });

      const obj: InsertSchema<typeof user> = { name: "yo", some: 1 };

      //console.log("user2", user.toJSON());
   });

   test("Post example", async () => {
      const posts1 = new Entity("posts", [
         new TextField("title", { required: true }),
         new TextField("content"),
         new DateField("created_at", {
            type: "datetime"
         }),
         new MediaField("images", { entity: "posts" }),
         new MediaField("cover", { entity: "posts", max_items: 1 })
      ]);

      const posts2 = entity("posts", {
         title: text().required(),
         content: text(),
         created_at: datetime(),
         images: media(),
         cover: medium()
      });

      type Posts = Schema<typeof posts2>;

      expect(posts1.toJSON()).toEqual(posts2.toJSON());
   });

   test("test example", async () => {
      const test = new Entity("test", [
         new TextField("name"),
         new BooleanField("checked", { default_value: false }),
         new NumberField("count"),
         new DateField("created_at"),
         new DateField("updated_at", { type: "datetime" }),
         new TextField("description"),
         new EnumField("status", {
            options: {
               type: "objects",
               values: [
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Not active" }
               ]
            }
         }),
         new JsonField("json")
      ]);

      const test2 = entity("test", {
         name: text(),
         checked: boolean({ default_value: false }),
         count: number(),
         created_at: date(),
         updated_at: datetime(),
         description: text(),
         status: enumm<"active" | "inactive">({
            enum: [
               { value: "active", label: "Active" },
               { value: "inactive", label: "Not active" }
            ]
         }),
         json: json<{ some: number }>()
      });

      expect(test.toJSON()).toEqual(test2.toJSON());
   });

   test("relations", async () => {
      const posts = entity("posts", {});
      const users = entity("users", {});
      const comments = entity("comments", {});
      const categories = entity("categories", {});
      const settings = entity("settings", {});
      const _media = entity("media", {});

      const relations = [
         new ManyToOneRelation(posts, users, { mappedBy: "author", required: true }),
         new OneToOneRelation(users, settings),
         new ManyToManyRelation(posts, categories),
         new ManyToOneRelation(comments, users, { required: true }),
         new ManyToOneRelation(comments, posts, { required: true }),

         // category has single image
         new PolymorphicRelation(categories, _media, {
            mappedBy: "image",
            targetCardinality: 1
         }),

         // post has multiple images
         new PolymorphicRelation(posts, _media, { mappedBy: "images" }),
         new PolymorphicRelation(posts, _media, { mappedBy: "cover", targetCardinality: 1 })
      ];

      const relations2 = [
         relation(posts).manyToOne(users, { mappedBy: "author", required: true }),
         relation(users).oneToOne(settings),
         relation(posts).manyToMany(categories),

         relation(comments).manyToOne(users, { required: true }),
         relation(comments).manyToOne(posts, { required: true }),

         relation(categories).polyToOne(_media, { mappedBy: "image" }),

         relation(posts).polyToMany(_media, { mappedBy: "images" }),
         relation(posts).polyToOne(_media, { mappedBy: "cover" })
      ];

      expect(relations.map((r) => r.toJSON())).toEqual(relations2.map((r) => r.toJSON()));
   });

   test("many to many fields", async () => {
      const posts = entity("posts", {});
      const categories = entity("categories", {});

      const rel = new ManyToManyRelation(
         posts,
         categories,
         {
            connectionTableMappedName: "custom"
         },
         [new TextField("description")]
      );

      const fields = {
         description: text()
      };
      let o: FieldSchema<typeof fields>;
      const rel2 = relation(posts).manyToMany(
         categories,
         {
            connectionTableMappedName: "custom"
         },
         fields
      );

      expect(rel.toJSON()).toEqual(rel2.toJSON());
   });

   test("devexample", async () => {
      const users = entity("users", {
         username: text()
      });

      const comments = entity("comments", {
         content: text()
      });

      const posts = entity("posts", {
         title: text().required(),
         content: text(),
         created_at: datetime(),
         images: media(),
         cover: medium()
      });

      const categories = entity("categories", {
         name: text(),
         description: text(),
         image: medium()
      });

      const settings = entity("settings", {
         theme: text()
      });

      const test = entity("test", {
         name: text(),
         checked: boolean({ default_value: false }),
         count: number(),
         created_at: date(),
         updated_at: datetime(),
         description: text(),
         status: enumm<"active" | "inactive">({
            enum: [
               { value: "active", label: "Active" },
               { value: "inactive", label: "Not active" }
            ]
         }),
         json: json<{ some: number }>()
      });

      const _media = entity("media", {});

      const relations = [
         relation(posts).manyToOne(users, { mappedBy: "author", required: true }),
         relation(posts).manyToMany(categories),
         relation(posts).polyToMany(_media, { mappedBy: "images" }),
         relation(posts).polyToOne(_media, { mappedBy: "cover" }),

         relation(categories).polyToOne(_media, { mappedBy: "image" }),

         relation(users).oneToOne(settings),

         relation(comments).manyToOne(users, { required: true }),
         relation(comments).manyToOne(posts, { required: true })
      ];

      const obj: Schema<typeof test> = {} as any;
   });
});
