import type { LoaderFunctionArgs } from "@remix-run/node";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "@remix-run/react";
import { ClientProvider } from "bknd/client";
import "./tailwind.css";
import { getApi } from "~/bknd";

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
   const api = await getApi(args);
   return {
      user: api.getUser()
   };
};

export default function App() {
   const data = useLoaderData<typeof loader>();

   // add user to the client provider to indicate
   // that you're authed using cookie
   return (
      <ClientProvider user={data.user}>
         <Outlet context={data} />
      </ClientProvider>
   );
}
