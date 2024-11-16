import { Route } from "wouter";
import { MediaEmpty, MediaRoot } from "./_media.root";

export default function MediaRoutes() {
   return (
      <MediaRoot>
         <Route path="/" component={MediaEmpty} />
      </MediaRoot>
   );
}
