import { Connection } from "./Connection";

export class DummyConnection extends Connection {
   constructor() {
      super(undefined as any);
   }
}
