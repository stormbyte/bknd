import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import React from "react";
import { FlashMessage } from "ui/modules/server/FlashMessage";
import { BkndProvider, ClientProvider, type ClientProviderProps, useBknd } from "./client";
import { createMantineTheme } from "./lib/mantine/theme";
import { BkndModalsProvider } from "./modals";
import { Routes } from "./routes";

export type BkndAdminProps = {
   baseUrl?: string;
   withProvider?: boolean | ClientProviderProps;
   // @todo: add admin config override
};

export default function Admin({ baseUrl: baseUrlOverride, withProvider = false }: BkndAdminProps) {
   const Component = (
      <BkndProvider>
         <AdminInternal />
      </BkndProvider>
   );
   return withProvider ? (
      <ClientProvider
         baseUrl={baseUrlOverride}
         {...(typeof withProvider === "object" ? withProvider : {})}
      >
         {Component}
      </ClientProvider>
   ) : (
      Component
   );
}

function AdminInternal() {
   const b = useBknd();
   const theme = b.app.getAdminConfig().color_scheme;

   return (
      <MantineProvider {...createMantineTheme(theme ?? "light")}>
         <Notifications />
         <FlashMessage />
         <BkndModalsProvider>
            <Routes />
         </BkndModalsProvider>
      </MantineProvider>
   );
}
