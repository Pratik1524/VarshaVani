"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, LogIn, LogOut, Menu, Sprout, X } from "lucide-react";
import { Logo, PrototypeBadge } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useAppStore, useHydrated } from "@/lib/store";
import { useT } from "@/hooks/useT";
import type { TKey } from "@/lib/i18n";

export const SHARED_NAV: { href: string; key: TKey }[] = [
  { href: "/map", key: "nav.map" },
  { href: "/drivers", key: "nav.drivers" },
  { href: "/simulator", key: "nav.simulator" },
  { href: "/replay", key: "nav.replay" },
  { href: "/gateway", key: "nav.gateway" },
  { href: "/methodology", key: "nav.methodology" },
];

/** Header for public and shared pages. */
export function SiteHeader() {
  const { t } = useT();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const hydrated = useHydrated();
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);

  const appHref = user?.role === "officer" ? "/officer" : "/farmer";

  return (
    <header className="sticky top-0 z-[1000] border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">
        {t("nav.skip")}
      </a>
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
        <Logo />

        <nav aria-label="Main" className="hidden flex-1 items-center gap-0 lg:flex xl:gap-1">
          {SHARED_NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={pathname === n.href ? "page" : undefined}
              className={`whitespace-nowrap rounded-lg px-1.5 py-1.5 text-[11.5px] font-medium transition xl:px-2.5 xl:text-[13px] ${
                pathname === n.href ? "bg-monsoon-50 text-monsoon-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {t(n.key)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <LanguageSwitcher compact />
          {hydrated && user ? (
            <Link
              href={appHref}
              className="hidden items-center gap-1.5 whitespace-nowrap rounded-lg bg-leaf-700 px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-leaf-800 sm:flex"
            >
              {user.role === "officer" ? <LayoutDashboard className="h-4 w-4" aria-hidden /> : <Sprout className="h-4 w-4" aria-hidden />}
              {user.role === "officer" ? t("nav.officer") : t("nav.home")}
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden items-center gap-1.5 whitespace-nowrap rounded-lg bg-leaf-700 px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-leaf-800 sm:flex"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              {t("nav.login")}
            </Link>
          )}
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-lg text-slate-700 transition hover:bg-slate-100 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t("common.close") : t("nav.more")}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Main" className="border-t border-slate-200 bg-white px-4 pb-4 pt-2 lg:hidden">
          <PrototypeBadge className="mb-2" />
          <ul className="grid gap-1 sm:grid-cols-2">
            {SHARED_NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-100"
                >
                  {t(n.key)}
                </Link>
              </li>
            ))}
            <li>
              {hydrated && user ? (
                <div className="flex gap-2">
                  <Link href={appHref} onClick={() => setOpen(false)} className="flex-1 rounded-lg bg-leaf-700 px-3 py-3 text-center font-semibold text-white">
                    {user.role === "officer" ? t("nav.officer") : t("nav.home")}
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setOpen(false);
                      router.push("/");
                    }}
                    className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-3 font-semibold text-slate-700"
                  >
                    <LogOut className="h-4 w-4" aria-hidden /> {t("nav.logout")}
                  </button>
                </div>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)} className="block rounded-lg bg-leaf-700 px-3 py-3 text-center font-semibold text-white">
                  {t("nav.login")}
                </Link>
              )}
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
