"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Farmer phone emulator helpers.
 *
 *  - "frame":    top-level window on a tablet/desktop screen. The farmer app is
 *                rendered inside a phone frame (an iframe of the same route).
 *  - "embedded": we are the app running inside that phone frame.
 *  - "plain":    top-level window on a real phone. No frame, full screen.
 */
export type EmulatorMode = "frame" | "embedded" | "plain";

const FRAME_QUERY = "(min-width: 640px) and (min-height: 560px)";

/** Message the embedded app posts to the host frame on every navigation. */
export const NAV_MESSAGE = "mm:navigate";

const isEmbedded = () => window.self !== window.top;

function subscribe(cb: () => void) {
  const mq = window.matchMedia(FRAME_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getSnapshot(): EmulatorMode {
  if (isEmbedded()) return "embedded";
  return window.matchMedia(FRAME_QUERY).matches ? "frame" : "plain";
}

/** Current emulator mode; `null` during server render / first hydration pass. */
export function useEmulatorMode(): EmulatorMode | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

/* ---------------- In-app back navigation ---------------- */

// Module-level so it survives layout switches (farmer shell <-> public pages)
// inside the same document. Resets on a full page load, which is fine.
const visited: string[] = [];

/**
 * Records in-app page visits so the back button can return to the page the
 * user actually came from, and (inside the emulator) tells the host frame
 * where we are so it can keep its address bar in sync.
 */
export function useTrackNavigation() {
  const pathname = usePathname();
  useEffect(() => {
    const top = visited[visited.length - 1];
    if (top !== pathname) {
      // Arriving at the previous entry means we went back (button or browser).
      if (visited[visited.length - 2] === pathname) visited.pop();
      else {
        visited.push(pathname);
        if (visited.length > 50) visited.shift();
      }
    }
    if (isEmbedded()) {
      // Router pathname, not window.location: the URL may lag during navigation.
      window.parent.postMessage({ type: NAV_MESSAGE, path: pathname }, window.location.origin);
    }
  }, [pathname]);
}

/** Go back to the previous in-app page, or to `fallback` when there is none. */
export function useBackNav(fallback = "/farmer") {
  const router = useRouter();
  const pathname = usePathname();
  return useCallback(() => {
    if (visited.length > 1 && visited[visited.length - 1] === pathname) router.back();
    else {
      visited.length = 0;
      router.push(fallback);
    }
  }, [router, pathname, fallback]);
}
