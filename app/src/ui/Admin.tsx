import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import React from "react";
import { BkndProvider, ClientProvider, useBknd } from "./client";
import { createMantineTheme } from "./lib/mantine/theme";
import { BkndModalsProvider } from "./modals";
import { Routes } from "./routes";

export default function Admin({
   baseUrl: baseUrlOverride,
   withProvider = false
}: { baseUrl?: string; withProvider?: boolean }) {
   const Component = (
      <BkndProvider>
         <AdminInternal />
      </BkndProvider>
   );
   return withProvider ? (
      <ClientProvider baseUrl={baseUrlOverride}>{Component}</ClientProvider>
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
         <BkndModalsProvider>
            <Routes />
         </BkndModalsProvider>
      </MantineProvider>
   );
}
