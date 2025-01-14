import { useBrowserTitle } from "ui/hooks/use-browser-title";
import { AuthScreen } from "ui/modules/auth/AuthScreen";

export function AuthLogin() {
   useBrowserTitle(["Login"]);
   return <AuthScreen action="login" />;
}
