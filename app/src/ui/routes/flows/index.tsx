import { Route, Switch } from "wouter";
import { FlowsRoot } from "./_flows.root";
import { FlowsEdit } from "./flows.edit.$name";
import { FlowsList } from "./flows.list";

export default function FlowsRoutes() {
   return (
      <Switch>
         <Route path="/flow/:flow" component={FlowsEdit} />
         <FlowsRoot>
            <Route path="/" component={FlowsList} />
         </FlowsRoot>
      </Switch>
   );
}
