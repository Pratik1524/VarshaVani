"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { EmbeddedBackButton } from "./EmbeddedBackButton";
import { NAV as OFFICER_NAV, OfficerShell } from "./OfficerShell";
import { useAppStore, useHydrated } from "@/lib/store";

/** Shared pages that also appear in the officer sidebar (map, drivers, ...). */
const OFFICER_SHARED = OFFICER_NAV.map((n) => n.href).filter((h) => !h.startsWith("/officer"));

// The role cookie is readable before the persisted store rehydrates, so an
// officer never sees the public header flash in place of the sidebar.
const readRoleCookie = () => document.cookie.match(/(?:^|;\s*)mm_role=(\w+)/)?.[1] ?? null;
const noopSubscribe = () => () => {};

function useIsOfficer(): boolean {
  const hydrated = useHydrated();
  const user = useAppStore((s) => s.user);
  const cookieRole = useSyncExternalStore(noopSubscribe, readRoleCookie, () => null);
  return (hydrated ? user?.role : cookieRole) === "officer";
}

/** Shell for public / shared pages (landing, map, drivers, simulator, ...). */
export function PageShell({
  children,
  wide = false,
  hero,
  header,
  footer,
}: {
  children?: ReactNode;
  wide?: boolean;
  /** Full-bleed block rendered above the measured content column. */
  hero?: ReactNode;
  /** Replaces the standard site header (used by the landing page only). */
  header?: ReactNode;
  /** Replaces the standard site footer (used by the landing page only). */
  footer?: ReactNode;
}) {
  const pathname = usePathname();
  const isOfficer = useIsOfficer();
  const content = children && <div className={`mx-auto w-full ${wide ? "max-w-[1600px]" : "max-w-7xl"}`}>{children}</div>;

  // Officers opening a shared page from their sidebar keep the officer frame
  // (fixed sidebar) instead of switching to the public top navigation.
  if (isOfficer && OFFICER_SHARED.includes(pathname)) {
    return (
      <OfficerShell>
        {hero}
        {content}
      </OfficerShell>
    );
  }

  return (
    <>
      {header ?? <SiteHeader />}
      <main id="main" className="w-full flex-1">
        {hero}
        {children && <div className={`mx-auto w-full px-4 py-6 ${wide ? "max-w-[1600px]" : "max-w-7xl"}`}>{children}</div>}
      </main>
      {footer ?? <SiteFooter />}
      <EmbeddedBackButton />
    </>
  );
}
