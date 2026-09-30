"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BookOpen,
  ClipboardCheck,
  FlaskConical,
  Globe,
  History,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  Megaphone,
  Menu,
  X,
} from "lucide-react";
import { LogoMark, PrototypeBadge } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useAppStore } from "@/lib/store";
import { useT } from "@/hooks/useT";
import type { TKey } from "@/lib/i18n";

export const NAV: { href: string; key: TKey; icon: typeof MapIcon }[] = [
  { href: "/officer", key: "nav.officer", icon: LayoutDashboard },
  { href: "/officer/campaign", key: "nav.campaign", icon: Megaphone },
  { href: "/map", key: "nav.map", icon: MapIcon },
  { href: "/drivers", key: "nav.drivers", icon: Globe },
  { href: "/simulator", key: "nav.simulator", icon: FlaskConical },
  { href: "/replay", key: "nav.replay", icon: History },
  { href: "/officer/contingency", key: "nav.contingency", icon: ClipboardCheck },
  { href: "/methodology", key: "nav.methodology", icon: BookOpen },
];

/** Desktop-optimised officer frame with a collapsible sidebar. */
export function OfficerShell({ children }: { children: ReactNode }) {
  const { t } = useT();
  const pathname = usePathname();
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const [open, setOpen] = useState(false);

  const nav = (
    <nav aria-label="Officer" className="flex flex-1 flex-col gap-1">
      {NAV.map(({ href, key, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={`relative flex items-center gap-3 rounded-control px-3 py-2.5 text-[13px] font-medium transition ${
              active ? "bg-white/12 font-semibold text-white" : "text-monsoon-100/90 hover:bg-white/8 hover:text-white"
            }`}
          >
            {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-leaf-300" aria-hidden />}
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[2000] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">
        {t("nav.skip")}
      </a>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-[1100] flex w-64 flex-col gap-5 bg-monsoon-950 p-4 text-white transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <Link href="/officer" className="flex items-center gap-2 rounded-control">
            <LogoMark className="h-7 w-7" />
            <span className="leading-tight">
              <span className="block text-[15px] font-bold">{t("app.name")}</span>
              <span className="block text-[10.5px] font-medium text-monsoon-200">{t("nav.officer")}</span>
            </span>
          </Link>
          <button className="rounded-control p-2 hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)} aria-label={t("common.close")}>
            <X className="h-5 w-5" />
          </button>
        </div>
        {nav}
        <div className="space-y-2 border-t border-white/12 pt-3">
          <p className="px-3 text-[13px] leading-snug text-monsoon-100">
            {user?.name}
            <br />
            <span className="text-[11px] text-monsoon-200">{user?.jurisdiction}</span>
          </p>
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="flex w-full items-center gap-2 rounded-control px-3 py-2 text-[13px] font-medium text-monsoon-100 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" aria-hidden /> {t("nav.logout")}
          </button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-[1050] bg-monsoon-950/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-[1000] flex items-center justify-between gap-3 border-b border-line bg-white/95 px-4 py-2.5 backdrop-blur lg:px-6">
          <div className="flex items-center gap-2">
            <button className="grid h-10 w-10 place-items-center rounded-control transition hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label={t("nav.more")}>
              <Menu className="h-5 w-5" />
            </button>
            <PrototypeBadge className="hidden sm:inline-flex" />
          </div>
          <LanguageSwitcher />
        </header>
        <main id="main" className="w-full flex-1 px-4 py-6 lg:px-6 xl:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
