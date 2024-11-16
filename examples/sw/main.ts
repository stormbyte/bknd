if ("serviceWorker" in navigator) {
   navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
         console.log("[-] unregister Service Worker");
         registration.unregister();
      }

      navigator.serviceWorker
         .register("./sw.ts?t=" + Date.now(), {
            type: "module"
         })
         .then(() => console.log("[+] service Worker registered"))
         .catch((err) => console.error("[!] service Worker registration failed:", err));

      navigator.serviceWorker.ready.then(() => {
         console.log("[√] service worker is ready and controlling the page.");
      });
   });
}
