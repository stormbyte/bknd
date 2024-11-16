import type { LoaderFunctionArgs } from "@remix-run/node";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";
import { Api } from "bknd";
import { ClientProvider } from "bknd/ui";

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
   args.context.api = new Api({
      host: new URL(args.request.url).origin
   });
   return null;
};

export default function App() {
   return (
      <ClientProvider>
         <Outlet />
      </ClientProvider>
   );
}
