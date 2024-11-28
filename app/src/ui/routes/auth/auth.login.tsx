import type { AppAuthOAuthStrategy } from "auth/auth-schema";
import { ucFirstAllSnakeToPascalWithSpaces } from "core/utils";
import { transform } from "lodash-es";
import { useAuthStrategies } from "ui/client/schema/auth/use-auth";
import { Button } from "ui/components/buttons/Button";
import { Logo } from "ui/components/display/Logo";
import { Link } from "ui/components/wouter/Link";
import { useBrowserTitle } from "ui/hooks/use-browser-title";
import { LoginForm } from "ui/modules/auth/LoginForm";
import * as AppShell from "../../layouts/AppShell/AppShell";

export function AuthLogin() {
   useBrowserTitle(["Login"]);
   const { strategies, basepath, loading } = useAuthStrategies();

   const oauth = transform(
      strategies ?? {},
      (result, value, key) => {
         if (value.type !== "password") {
            result[key] = value.config;
         }
      },
      {}
   ) as Record<string, AppAuthOAuthStrategy>;
   //console.log("oauth", oauth, strategies);

   return (
      <AppShell.Root>
         <AppShell.Content center>
            {!loading && (
               <div className="flex flex-col gap-4 items-center w-96 px-6 py-7">
                  <Link href={"/"} className="link">
                     <Logo scale={0.25} />
                  </Link>
                  <div className="flex flex-col items-center">
                     <h1 className="text-xl font-bold">Sign in to your admin panel</h1>
                     <p className="text-primary/50">Enter your credentials below to get access.</p>
                  </div>
                  <div className="flex flex-col gap-4 w-full">
                     {Object.keys(oauth).length > 0 && (
                        <>
                           {Object.entries(oauth)?.map(([name, oauth], key) => (
                              <form
                                 method="POST"
                                 action={`${basepath}/${name}/login`}
                                 key={key}
                                 className="w-full"
                              >
                                 <Button
                                    key={key}
                                    type="submit"
                                    size="large"
                                    variant="outline"
                                    className="justify-center w-full"
                                 >
                                    Continue with {ucFirstAllSnakeToPascalWithSpaces(oauth.name)}
                                 </Button>
                              </form>
                           ))}

                           <div className="w-full flex flex-row items-center">
                              <div className="relative flex grow">
                                 <div className="h-px bg-primary/10 w-full absolute top-[50%] z-0" />
                              </div>
                              <div className="mx-5">or</div>
                              <div className="relative flex grow">
                                 <div className="h-px bg-primary/10 w-full absolute top-[50%] z-0" />
                              </div>
                           </div>
                        </>
                     )}

                     <LoginForm action="/api/auth/password/login" />
                     {/*<a href="/auth/logout">Logout</a>*/}
                  </div>
               </div>
            )}
         </AppShell.Content>
      </AppShell.Root>
   );
}
