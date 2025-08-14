import { create } from "zustand";
import { combine } from "zustand/middleware";

import type { ToolJson } from "jsonv-ts/mcp";

const FEATURES = ["tools", "resources"] as const;
export type Feature = (typeof FEATURES)[number];

export const useMcpStore = create(
   combine(
      {
         tools: [] as ToolJson[],
         feature: "tools" as Feature | null,
         content: null as ToolJson | null,
      },
      (set) => ({
         setTools: (tools: ToolJson[]) => set({ tools }),
         setFeature: (feature: Feature) => set({ feature }),
         setContent: (content: ToolJson | null) => set({ content }),
      }),
   ),
);
