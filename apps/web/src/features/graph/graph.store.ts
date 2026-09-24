import type { FanriGraph } from "@fanri/core/ir";
import { create } from "zustand";
import { apiGet } from "@/shared/api";

interface GraphState {
  graph?: FanriGraph;
  status: "idle" | "loading" | "ready" | "error";
  error?: string;
  selectedId?: string;
  load(): Promise<void>;
  select(id?: string): void;
}

export const useGraphStore = create<GraphState>((set) => ({
  status: "idle",
  async load() {
    set({ status: "loading", error: undefined });
    try {
      set({ graph: await apiGet<FanriGraph>("/graph"), status: "ready" });
    } catch (err) {
      set({ status: "error", error: err instanceof Error ? err.message : String(err) });
    }
  },
  select(selectedId) {
    set({ selectedId });
  },
}));
