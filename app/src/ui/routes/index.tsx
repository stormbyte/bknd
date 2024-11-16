import { Suspense, lazy } from "react";
import { Route, Router, Switch } from "wouter";
import { useBknd } from "../client/BkndProvider";
import { AuthLogin } from "./auth/auth.login";
import { Root, RootEmpty } from "./root";

const DataRoutes = lazy(() => import("./data"));
const AuthRoutes = lazy(() => import("./auth"));
const MediaRoutes = lazy(() => import("./media"));
const FlowRoutes = lazy(() => import("./flows"));
const SettingsRoutes = lazy(() => import("./settings"));

// @ts-ignore
const TestRoutes = lazy(() => import("./test"));

export function Routes() {
   const { app } = useBknd();
   const { color_scheme: theme } = app.getAdminConfig();
   const { basepath } = app.getAdminConfig();

   return (
      <div id="bknd-admin" className={(theme ?? "light") + " antialiased"}>
         <Router base={basepath}>
            <Switch>
               <Route path="/auth/login" component={AuthLogin} />
               <Route path="/" nest>
                  <Root>
                     <Switch>
                        <Route path="/test*" nest>
                           <Suspense fallback={null}>
                              <TestRoutes />
                           </Suspense>
                        </Route>

                        <Route path="/" component={RootEmpty} />
                        <Route path="/data" nest>
                           <Suspense fallback={null}>
                              <DataRoutes />
                           </Suspense>
                        </Route>
                        <Route path="/flows" nest>
                           <Suspense fallback={null}>
                              <FlowRoutes />
                           </Suspense>
                        </Route>
                        <Route path="/auth" nest>
                           <Suspense fallback={null}>
                              <AuthRoutes />
                           </Suspense>
                        </Route>
                        <Route path="/media" nest>
                           <Suspense fallback={null}>
                              <MediaRoutes />
                           </Suspense>
                        </Route>
                        <Route path="/settings" nest>
                           <Suspense fallback={null}>
                              <SettingsRoutes />
                           </Suspense>
                        </Route>

                        <Route path="*" component={NotFound} />
                     </Switch>
                  </Root>
               </Route>
            </Switch>
         </Router>
      </div>
   );
}

function NotFound() {
   return (
      <div className="flex w-full items-center justify-center">
         <p className="text-2xl font-mono">
            <span className="font-bold">404</span>
            <span className="opacity-50">, Sorry :)</span>
         </p>
      </div>
   );
}
