import type { ReactNode } from "react";
import { useAuthStrategies } from "ui/client/schema/auth/use-auth";
import { Logo } from "ui/components/display/Logo";
import { Link } from "ui/components/wouter/Link";
import { AuthForm } from "ui/modules/auth/AuthForm";

export type AuthScreenProps = {
   method?: "POST" | "GET";
   action?: "login" | "register";
   logo?: ReactNode;
   intro?: ReactNode;
};

export function AuthScreen({ method = "POST", action = "login", logo, intro }: AuthScreenProps) {
   const { strategies, basepath, loading } = useAuthStrategies();

   return (
      <div className="flex flex-1 flex-col select-none h-dvh w-dvw justify-center items-center bknd-admin">
         {!loading && (
            <div className="flex flex-col gap-4 items-center w-96 px-6 py-7">
               {typeof logo !== "undefined" ? (
                  logo
               ) : (
                  <Link href={"/"} className="link">
                     <Logo scale={0.25} />
                  </Link>
               )}
               {typeof intro !== "undefined" ? (
                  intro
               ) : (
                  <div className="flex flex-col items-center">
                     <h1 className="text-xl font-bold">Sign in to your admin panel</h1>
                     <p className="text-primary/50">Enter your credentials below to get access.</p>
                  </div>
               )}
               <AuthForm auth={{ basepath, strategies }} method={method} action={action} />
            </div>
         )}
      </div>
   );
}
