import * as React from "react";
import * as ReactDOM from "react-dom/client";
import "./main.css";

import Admin from "./Admin";

function ClientApp() {
   return <Admin withProvider />;
}

// Render the app
const rootElement = document.getElementById("app")!;
const shouldRender =
   !rootElement.innerHTML ||
   (rootElement.childElementCount === 1 && rootElement.firstElementChild?.id === "loading");
if (shouldRender) {
   const root = ReactDOM.createRoot(rootElement);
   root.render(
      <React.StrictMode>
         <ClientApp />
      </React.StrictMode>
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
