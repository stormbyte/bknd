import "@/styles/globals.css";
import { ClientProvider } from "bknd/client";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
   return (
      <ClientProvider baseUrl="http://localhost:3000">
         <Component {...pageProps} />
      </ClientProvider>
   );
}
