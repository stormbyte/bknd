import { create } from "zustand";
import { combine, persist } from "zustand/middleware";

export const appShellStore = create(
   persist(
      combine(
         {
            sidebarOpen: false as boolean,
            sidebarWidth: 350 as number,
         },
         (set) => ({
            toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
            closeSidebar: () => set({ sidebarOpen: false }),
            openSidebar: () => set({ sidebarOpen: true }),
            setSidebarWidth: (width: number) => set({ sidebarWidth: width }),
            resetSidebarWidth: () => set({ sidebarWidth: 350 }),
         }),
      ),
      {
         name: "appshell",
      },
   ),
);
