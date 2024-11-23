import type { AppAuthOAuthStrategy } from "auth/auth-schema";
import { Type, ucFirst, ucFirstAllSnakeToPascalWithSpaces } from "core/utils";
import { transform } from "lodash-es";
import { useEffect, useState } from "react";
import { useAuth } from "ui/client";
import { useAuthStrategies } from "ui/client/schema/auth/use-auth";
import { Button } from "ui/components/buttons/Button";
import { Logo } from "ui/components/display/Logo";
import { Link } from "ui/components/wouter/Link";
import { useBrowserTitle } from "ui/hooks/use-browser-title";
import { useSearch } from "ui/hooks/use-search";
import { LoginForm } from "ui/modules/auth/LoginForm";
import { useLocation } from "wouter";
import * as AppShell from "../../layouts/AppShell/AppShell";

const schema = Type.Object({
   token: Type.String()
});

export function AuthLogin() {
   useBrowserTitle(["Login"]);
   const [, navigate] = useLocation();
   const search = useSearch(schema);
   const token = search.value.token;
   //console.log("search", token, "/api/auth/google?redirect=" + window.location.href);

   const auth = useAuth();
   const { strategies, basepath, loading } = useAuthStrategies();
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
      if (token) {
         auth.setToken(token);
      }
   }, [token]);

   async function handleSubmit(value: { email: string; password: string }) {
      console.log("submit", value);
      const { res, data } = await auth.login(value);
      if (!res.ok) {
         if (data && "error" in data) {
            setError(data.error.message);
         } else {
            setError("An error occurred");
         }
      } else if (error) {
         setError(null);
      }
      console.log("res:login", { res, data });
   }

   if (auth.user) {
      console.log("user set", auth.user);
      navigate("/", { replace: true });
   }

   const oauth = transform(
      strategies ?? {},
      (result, value, key) => {
         if (value.type !== "password") {
            result[key] = value.config;
         }
      },
      {}
   ) as Record<string, AppAuthOAuthStrategy>;
   console.log("oauth", oauth, strategies);

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
                  {error && (
                     <div className="bg-red-500/40 p-3 w-full rounded font-bold mb-1">
                        <span>{error}</span>
                     </div>
                  )}
                  <div className="flex flex-col gap-4 w-full">
                     {Object.keys(oauth).length > 0 && (
                        <>
                           {Object.entries(oauth)?.map(([name, oauth], key) => (
                              <Button
                                 key={key}
                                 size="large"
                                 variant="outline"
                                 className="justify-center"
                                 onClick={() => {
                                    window.location.href = `${basepath}/${name}/login?redirect=${window.location.href}`;
                                 }}
                              >
                                 Continue with {ucFirstAllSnakeToPascalWithSpaces(oauth.name)}
                              </Button>
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

                     <LoginForm onSubmitted={handleSubmit} />
                  </div>
               </div>
            )}
         </AppShell.Content>
      </AppShell.Root>
   );
}
