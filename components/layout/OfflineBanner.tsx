"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useT } from "@/hooks/useT";

export function OfflineBanner() {
  const online = useOnlineStatus();
  const { t } = useT();
  if (online) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-[1200] flex items-center justify-center gap-2 bg-monsoon-950 px-4 py-2 text-[13px] font-medium text-white"
    >
      <WifiOff className="h-4 w-4" aria-hidden />
      {t("offline.banner")}
    </div>
  );
}
