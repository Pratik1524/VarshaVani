"use client";

/**
 * Global client state (Zustand, persisted to localStorage).
 * Holds auth, language, selected block/crop, farmer crops, feedback,
 * simulated campaign messages and alerts.
 *
 * `skipHydration` avoids SSR/CSR mismatches: <StoreHydrator/> rehydrates
 * after mount and `useHydrated()` tells components when state is ready.
 */
import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AlertItem, DeliveryStatus, FarmerCrop, FeedbackEntry, Lang, MessageLog } from "@/types";
import { setRoleCookie, type MockUser } from "./mockAuth";
import { DEMO_FARMER } from "@/data/community";
import { BLOCK_BY_ID, HERO_BLOCK_ID } from "@/data/blocks";

interface AppState {
  lang: Lang;
  user: MockUser | null;
  blockId: string;
  crops: FarmerCrop[];
  activeCropId: string | null;
  feedback: FeedbackEntry[];
  messages: MessageLog[];
  alerts: AlertItem[];
  readAlertIds: string[];

  setLang: (l: Lang) => void;
  login: (u: MockUser) => void;
  logout: () => void;
  village: string;
  setBlockId: (id: string) => void;
  setLocation: (blockId: string, village: string) => void;
  addCrop: (c: FarmerCrop) => void;
  updateCrop: (c: FarmerCrop) => void;
  removeCrop: (id: string) => void;
  setActiveCrop: (id: string) => void;
  addFeedback: (f: FeedbackEntry) => void;
  addMessage: (m: MessageLog) => void;
  setMessageStatus: (id: string, status: DeliveryStatus) => void;
  pushAlert: (a: AlertItem) => void;
  markAlertsRead: (ids: string[]) => void;
  resetDemo: () => void;
}

type DataState = Pick<
  AppState,
  "lang" | "user" | "blockId" | "village" | "crops" | "activeCropId" | "feedback" | "messages" | "alerts" | "readAlertIds"
>;

const initial: DataState = {
  lang: "en",
  user: null,
  blockId: HERO_BLOCK_ID,
  village: DEMO_FARMER.village,
  crops: DEMO_FARMER.crops,
  activeCropId: DEMO_FARMER.crops[0].id,
  feedback: [],
  messages: [],
  alerts: [],
  readAlertIds: [],
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initial,
      setLang: (lang) => set({ lang }),
      login: (user) => {
        setRoleCookie(user.role);
        set((s) => ({ user, blockId: user.blockId ?? s.blockId }));
      },
      logout: () => {
        setRoleCookie(null);
        set({ user: null });
      },
      setBlockId: (blockId) => set({ blockId, village: BLOCK_BY_ID[blockId]?.villages[0] ?? "" }),
      setLocation: (blockId, village) => set({ blockId, village }),
      addCrop: (c) => set((s) => ({ crops: [...s.crops, c], activeCropId: s.activeCropId ?? c.id })),
      updateCrop: (c) => set((s) => ({ crops: s.crops.map((x) => (x.id === c.id ? c : x)) })),
      removeCrop: (id) =>
        set((s) => {
          const crops = s.crops.filter((x) => x.id !== id);
          return { crops, activeCropId: s.activeCropId === id ? (crops[0]?.id ?? null) : s.activeCropId };
        }),
      setActiveCrop: (activeCropId) => set({ activeCropId }),
      addFeedback: (f) => set((s) => ({ feedback: [f, ...s.feedback] })),
      addMessage: (m) => set((s) => ({ messages: [m, ...s.messages] })),
      setMessageStatus: (id, status) =>
        set((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, status } : m)) })),
      pushAlert: (a) => set((s) => ({ alerts: [a, ...s.alerts].slice(0, 30) })),
      markAlertsRead: (ids) => set((s) => ({ readAlertIds: Array.from(new Set([...s.readAlertIds, ...ids])) })),
      resetDemo: () => set({ ...initial, lang: get().lang, user: get().user }),
    }),
    {
      name: "mausammitra-state",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);

/** True once persisted state has been loaded on the client. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useAppStore.persist.onFinishHydration(cb),
    () => useAppStore.persist.hasHydrated(),
    () => false,
  );
}

/** Active farmer crop (falls back to the first crop). */
export function useActiveCrop(): FarmerCrop | undefined {
  const crops = useAppStore((s) => s.crops);
  const activeId = useAppStore((s) => s.activeCropId);
  return crops.find((c) => c.id === activeId) ?? crops[0];
}
