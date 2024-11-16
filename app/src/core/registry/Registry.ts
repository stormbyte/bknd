export type Constructor<T> = new (...args: any[]) => T;
export class Registry<Item, Items extends Record<string, object> = Record<string, object>> {
   private is_set: boolean = false;
   private items: Items = {} as Items;

   set<Actual extends Record<string, object>>(items: Actual) {
      if (this.is_set) {
         throw new Error("Registry is already set");
      }
      // @ts-ignore
      this.items = items;
      this.is_set = true;

      return this as unknown as Registry<Item, Actual>;
   }

   add(name: string, item: Item) {
      // @ts-ignore
      this.items[name] = item;
      return this;
   }

   get<Name extends keyof Items>(name: Name): Items[Name] {
      return this.items[name];
   }

   all() {
      return this.items;
   }
}
