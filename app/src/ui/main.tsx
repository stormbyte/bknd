import React, { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

import Admin from "./Admin";

function ClientApp() {
   return <Admin withProvider />;
}

// Render the app
const rootElement = document.getElementById("app")!;
if (!rootElement.innerHTML) {
   const root = ReactDOM.createRoot(rootElement);
   root.render(
      <StrictMode>
         <ClientApp />
      </StrictMode>
   );
}

// REGISTER ERROR OVERLAY
if (process.env.NODE_ENV !== "production") {
   const showErrorOverlay = (err) => {
      // must be within function call because that's when the element is defined for sure.
      const ErrorOverlay = customElements.get("vite-error-overlay");
      // don't open outside vite environment
      if (!ErrorOverlay) {
         return;
      }
      //console.log("error", err);
      const overlay = new ErrorOverlay(err);
      document.body.appendChild(overlay);
   };

   window.addEventListener("error", ({ error }) => showErrorOverlay(error));
   window.addEventListener("unhandledrejection", ({ reason }) => showErrorOverlay(reason));
}
