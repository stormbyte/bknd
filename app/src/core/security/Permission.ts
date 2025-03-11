export class Permission<Name extends string = string> {
   constructor(public name: Name) {
      this.name = name;
   }

   toJSON() {
      return {
         name: this.name,
      };
   }
}
