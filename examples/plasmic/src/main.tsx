import { ClientProvider } from "bknd/client";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
   <StrictMode>
      <ClientProvider>
         <App />
      </ClientProvider>
   </StrictMode>
);
