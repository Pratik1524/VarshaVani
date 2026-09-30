"use client";

import { useEffect, type ReactNode } from "react";
import { useAppStore } from "@/lib/store";
import { OfflineBanner } from "@/components/layout/OfflineBanner";

/**
 * Client-side app wiring:
 *  - rehydrates persisted Zustand state after mount (avoids SSR mismatch)
 *  - keeps <html lang> in sync with the selected language
 *  - registers the service worker (PWA / offline) in production
 */
export function Providers({ children }: { children: ReactNode }) {
  const lang = useAppStore((s) => s.lang);

  useEffect(() => {
    void useAppStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "en" ? "en-IN" : `${lang}-IN`;
  }, [lang]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* SW is progressive enhancement; ignore failures */
    });
  }, []);

  return (
    <>
      <OfflineBanner />
      {children}
    </>
  );
}
