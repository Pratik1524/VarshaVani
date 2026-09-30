"use client";

import type { ReactNode } from "react";
import { RequireRole } from "@/components/layout/RequireRole";
import { OfficerShell } from "@/components/layout/OfficerShell";

export default function OfficerLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole role="officer">
      <OfficerShell>{children}</OfficerShell>
    </RequireRole>
  );
}
