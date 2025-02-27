import { useAuthStrategies } from "../hooks/use-auth";
import { AuthForm } from "./AuthForm";
import { AuthScreen } from "./AuthScreen";
import { SocialLink } from "./SocialLink";

export const Auth = {
   Screen: AuthScreen,
   Form: AuthForm,
   SocialLink: SocialLink,
};

export { useAuthStrategies };
