import type { LoaderFunctionArgs } from "@remix-run/node";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "@remix-run/react";
import { Api, ClientProvider } from "bknd/client";

declare module "@remix-run/server-runtime" {
   export interface AppLoadContext {
      api: Api;
   }
}

export function Layout({ children }: { children: React.ReactNode }) {
   return (
      <html lang="en">
         <head>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <Meta />
            <Links />
         </head>
         <body>
            {children}
            <ScrollRestoration />
            <Scripts />
         </body>
      </html>
   );
}

export const loader = async (args: LoaderFunctionArgs) => {
   const api = new Api({
      host: new URL(args.request.url).origin,
      headers: args.request.headers
   });

   // add api to the context
   args.context.api = api;

   await api.verifyAuth();
   return {
      user: api.getAuthState()?.user
   };
};

export default function App() {
   const data = useLoaderData<typeof loader>();

   // add user to the client provider to indicate
   // that you're authed using cookie
   return (
      <ClientProvider user={data.user}>
         <Outlet />
      </ClientProvider>
   );
}
