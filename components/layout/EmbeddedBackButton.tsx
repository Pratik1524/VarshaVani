"use client";

import { ArrowLeft } from "lucide-react";
import { useBackNav, useEmulatorMode, useTrackNavigation } from "@/hooks/useEmulator";
import { useAppStore } from "@/lib/store";
import { tx } from "@/lib/i18n/farmerExtras";

/**
 * Shared pages (drivers, simulator, ...) can be opened from inside the farmer
 * phone emulator. There they get a floating back button so the farmer can
 * return to where they came from. Renders nothing outside the emulator.
 */
export function EmbeddedBackButton() {
  const mode = useEmulatorMode();
  const lang = useAppStore((s) => s.lang);
  useTrackNavigation();
  const back = useBackNav("/farmer");
  if (mode !== "embedded") return null;
  return (
    <button
      type="button"
      onClick={back}
      className="fixed bottom-4 left-4 z-[1100] inline-flex min-h-11 items-center gap-1.5 rounded-full bg-monsoon-950/92 px-4 text-[13.5px] font-semibold text-white shadow-lift backdrop-blur transition hover:bg-monsoon-900"
    >
      <ArrowLeft className="h-4.5 w-4.5" aria-hidden />
      {tx(lang, "back")}
    </button>
  );
}
