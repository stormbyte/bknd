import { Route } from "wouter";
import { MediaRoot } from "./_media.root";
import { MediaIndex } from "./media.index";
import { MediaSettings } from "./media.settings";

export default function MediaRoutes() {
   return (
      <MediaRoot>
         <Route path="/" component={MediaIndex} />
         <Route path="/settings" component={MediaSettings} />
      </MediaRoot>
   );
}
