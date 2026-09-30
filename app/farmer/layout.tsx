"use client";

import type { ReactNode } from "react";
import { RequireRole } from "@/components/layout/RequireRole";
import { FarmerShell } from "@/components/layout/FarmerShell";
import { PhoneEmulator } from "@/components/layout/PhoneEmulator";
import { useEmulatorMode } from "@/hooks/useEmulator";

export default function FarmerLayout({ children }: { children: ReactNode }) {
  const mode = useEmulatorMode();
  return (
    <RequireRole role="farmer">
      {/* On larger screens the whole farmer app runs inside a phone emulator. */}
      {mode === "frame" ? <PhoneEmulator /> : mode ? <FarmerShell>{children}</FarmerShell> : null}
    </RequireRole>
  );
}
