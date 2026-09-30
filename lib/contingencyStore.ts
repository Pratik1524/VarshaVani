"use client";

/**
 * Checklist progress for the Contingency Planner, saved in the browser
 * (localStorage) per filter combination. Separate from the main app store
 * so resetting the demo elsewhere never touches it (and vice versa).
 */
import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { TaskKind, TaskStatus } from "./contingency";

interface PlannerState {
  /** planKey → task id → status */
  progress: Record<string, Partial<Record<TaskKind, TaskStatus>>>;
  setStatus: (plan: string, task: TaskKind, status: TaskStatus) => void;
  reset: (plan: string) => void;
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set) => ({
      progress: {},
      setStatus: (plan, task, status) => set((s) => ({ progress: { ...s.progress, [plan]: { ...s.progress[plan], [task]: status } } })),
      reset: (plan) =>
        set((s) => {
          const next = { ...s.progress };
          delete next[plan];
          return { progress: next };
        }),
    }),
    { name: "mausammitra-contingency", version: 1, storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);

/** Load saved progress after mount; true once it is available. */
export function usePlannerHydrated(): boolean {
  useEffect(() => {
    if (!usePlannerStore.persist.hasHydrated()) void usePlannerStore.persist.rehydrate();
  }, []);
  return useSyncExternalStore(
    (cb) => usePlannerStore.persist.onFinishHydration(cb),
    () => usePlannerStore.persist.hasHydrated(),
    () => false,
  );
}
