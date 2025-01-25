import type { LoaderFunctionArgs } from "@remix-run/node";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "@remix-run/react";
import { withApi } from "bknd/adapter/remix";
import { type Api, ClientProvider } from "bknd/client";

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

declare module "@remix-run/server-runtime" {
   export interface AppLoadContext {
      api: Api;
   }
}

export const loader = withApi(async (args: LoaderFunctionArgs, api: Api) => {
   return {
      user: api.getUser()
   };
});

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
