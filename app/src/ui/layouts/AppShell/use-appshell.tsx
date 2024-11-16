import { useDisclosure, useViewportSize } from "@mantine/hooks";
import { createContext, useContext } from "react";

export type AppShellContextType = {
   sidebar: {
      open: boolean;
      handler: ReturnType<typeof useDisclosure>[1];
   };
};

const AppShellContext = createContext<AppShellContextType>(undefined as any);

export function AppShellProvider({ children }) {
   const { width } = useViewportSize(); // @todo: maybe with throttle, not a problem atm
   const [sidebarOpen, sidebarHandlers] = useDisclosure(width > 768);

   return (
      <AppShellContext.Provider
         value={{ sidebar: { open: sidebarOpen, handler: sidebarHandlers } }}
      >
         {children}
      </AppShellContext.Provider>
   );
}

export function useAppShell() {
   return useContext(AppShellContext);
}
