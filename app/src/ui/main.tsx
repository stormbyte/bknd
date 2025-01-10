import * as React from "react";
import * as ReactDOM from "react-dom/client";
import Admin from "./Admin";
import "./main.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
   <React.StrictMode>
      <Admin withProvider />
   </React.StrictMode>
);

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
