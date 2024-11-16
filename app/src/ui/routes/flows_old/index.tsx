import { Route } from "wouter";
import { FlowsEmpty, FlowsRoot } from "./_flows.root";
import { FlowEdit } from "./flow.$key";

export default function FlowRoutes() {
   return (
      <FlowsRoot>
         <Route path="/" component={FlowsEmpty} />
         <Route path="/flow/:flow" component={FlowEdit} />
      </FlowsRoot>
   );
}
