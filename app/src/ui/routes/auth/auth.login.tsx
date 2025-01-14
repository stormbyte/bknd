import { Logo } from "ui/components/display/Logo";
import { Link } from "ui/components/wouter/Link";
import { Auth } from "ui/elements";
import { useBrowserTitle } from "ui/hooks/use-browser-title";

export function AuthLogin() {
   useBrowserTitle(["Login"]);
   return (
      <Auth.Screen
         action="login"
         logo={
            <Link href={"/"} className="link">
               <Logo scale={0.25} />
            </Link>
         }
      />
   );
}
