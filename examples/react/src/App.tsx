import { useEffect, useState } from "react";
import { App } from "bknd";
import { Admin } from "bknd/ui";
import { checksum } from "bknd/utils";
import { em, entity, text } from "bknd/data";
import { SQLocalConnection } from "@bknd/sqlocal";
import "bknd/dist/styles.css";

export default function () {
   const [app, setApp] = useState<App | undefined>(undefined);
   const [hash, setHash] = useState<string>("");

   async function onBuilt(app: App) {
      setApp(app);
      setHash(await checksum(app.toJSON()));
   }

   useEffect(() => {
      setup({
         onBuilt,
      })
         .then((app) => console.log("setup", app?.version()))
         .catch(console.error);
   }, []);

   if (!app) return null;

   return (
      // @ts-ignore
      <Admin key={hash} withProvider={{ api: app.getApi() }} />
   );
}

let initialized = false;
export async function setup(opts?: {
   beforeBuild?: (app: App) => Promise<void>;
   onBuilt?: (app: App) => Promise<void>;
}) {
   if (initialized) return;
   initialized = true;

   const connection = new SQLocalConnection({
      verbose: true,
   });

   const app = App.create({
      connection,
      initialConfig: {
         data: em({
            test: entity("test", {
               name: text(),
            }),
         }).toJSON(),
      },
   });

   if (opts?.onBuilt) {
      app.emgr.onEvent(
         App.Events.AppBuiltEvent,
         async () => {
            await opts.onBuilt?.(app);
         },
         "sync",
      );
   }

   await opts?.beforeBuild?.(app);
   await app.build({ sync: true });

   return app;
}
