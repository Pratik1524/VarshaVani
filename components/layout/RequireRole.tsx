"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore, useHydrated } from "@/lib/store";
import type { Role } from "@/lib/mockAuth";
import { CardSkeleton } from "@/components/ui/States";

/**
 * Client-side route guard for the mock auth. Redirects to /login when the
 * persisted user is missing or has a different role.
 * NOTE: prototype only; real apps must enforce access on the server.
 */
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const hydrated = useHydrated();
  const user = useAppStore((s) => s.user);
  const router = useRouter();
  const pathname = usePathname();
  const allowed = hydrated && user?.role === role;

  useEffect(() => {
    if (hydrated && user?.role !== role) {
      router.replace(`/login?role=${role}&next=${encodeURIComponent(pathname)}`);
    }
  }, [hydrated, user, role, router, pathname]);

  if (!allowed) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-3 p-4">
        <CardSkeleton lines={4} />
        <CardSkeleton lines={2} />
      </div>
    );
  }
  return <>{children}</>;
}
