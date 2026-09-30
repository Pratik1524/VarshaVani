"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Bell, Bot, CalendarDays, House, Map as MapIcon, MapPin, Menu, Sprout } from "lucide-react";
import { Logo, PrototypeBadge } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { ChatbotPanel } from "@/components/farmer/ChatbotPanel";
import { MessageLauncher } from "@/components/farmer/MessageLauncher";
import { useAppStore } from "@/lib/store";
import { useT } from "@/hooks/useT";
import { useAsync } from "@/hooks/useAsync";
import { useBackNav, useTrackNavigation } from "@/hooks/useEmulator";
import { getForecast } from "@/lib/forecastService";
import { buildAlerts } from "@/lib/alerts";
import { tx } from "@/lib/i18n/farmerExtras";
import { BLOCK_BY_ID, blockName } from "@/data/blocks";
import type { TKey } from "@/lib/i18n";

const TABS: { href: string; key: TKey; icon: typeof House }[] = [
  { href: "/farmer", key: "nav.home", icon: House },
  { href: "/farmer/outlook", key: "nav.outlook", icon: CalendarDays },
  { href: "/farmer/advisories", key: "nav.advice", icon: Sprout },
  { href: "/farmer/map", key: "nav.map", icon: MapIcon },
  { href: "/farmer/more", key: "nav.more", icon: Menu },
];

/** Full-screen screens (chat apps) that draw their own header and have no tab bar. */
const IMMERSIVE = ["/farmer/whatsapp", "/farmer/sms"];

/** Mobile-first farmer app frame: compact header + icon-first bottom tabs. */
export function FarmerShell({ children }: { children: ReactNode }) {
  const { t, lang } = useT();
  const pathname = usePathname();
  const blockId = useAppStore((s) => s.blockId);
  const pushed = useAppStore((s) => s.alerts);
  const readIds = useAppStore((s) => s.readAlertIds);
  const block = BLOCK_BY_ID[blockId];
  const { data: forecast } = useAsync(() => getForecast(blockId), blockId);
  const derived = forecast && block ? buildAlerts(forecast, block) : [];
  const unread = [...pushed, ...derived].filter((a) => !readIds.includes(a.id)).length;
  const [chatOpen, setChatOpen] = useState(false);
  const closeChat = useCallback(() => setChatOpen(false), []);
  const root = useRef<HTMLDivElement>(null);
  const header = useRef<HTMLElement>(null);

  useTrackNavigation();
  const goBack = useBackNav("/farmer");

  const isHome = pathname === "/farmer";
  const immersive = IMMERSIVE.includes(pathname);
  const isActive = (href: string) => (href === "/farmer" ? pathname === "/farmer" : pathname.startsWith(href));

  // Expose the header height so pages can pin content right below it.
  useEffect(() => {
    const el = header.current;
    if (!el || !root.current) return;
    const apply = () => root.current?.style.setProperty("--farmer-header-h", `${el.offsetHeight}px`);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [immersive]);

  if (immersive) {
    return (
      <main id="main" className="flex h-dvh flex-col">
        {children}
      </main>
    );
  }

  return (
    <div ref={root} className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[2000] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">
        {t("nav.skip")}
      </a>
      <header ref={header} className="sticky top-0 z-[1000] border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-1.5 px-3 py-2">
          <div className="flex min-w-0 items-center gap-1.5">
            {isHome ? (
              <Logo href="/farmer" compact />
            ) : (
              <button
                type="button"
                onClick={goBack}
                aria-label={tx(lang, "back")}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink transition hover:bg-slate-100"
              >
                <ArrowLeft className="h-5 w-5" aria-hidden />
              </button>
            )}
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[14px] font-bold text-ink">{t("app.name")}</p>
              <p className="flex items-center gap-1 truncate text-[11.5px] text-muted">
                <MapPin className="h-3 w-3 shrink-0 text-leaf-600" aria-hidden />
                <span className="truncate">{blockName(block, lang)}</span>
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <LanguageSwitcher compact />
            <Link
              href="/farmer/alerts"
              className="relative grid h-10 w-10 place-items-center rounded-control text-body transition hover:bg-slate-100"
              aria-label={`${t("nav.alerts")}${unread ? ` (${unread})` : ""}`}
            >
              <Bell className="h-5 w-5" aria-hidden />
              {unread > 0 && (
                <span className="absolute right-1 top-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-red-600 px-1 text-[10.5px] font-bold text-white ring-2 ring-white">
                  {unread}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              aria-label={tx(lang, "botOpen")}
              aria-haspopup="dialog"
              className="grid h-10 w-10 place-items-center rounded-full bg-leaf-700 text-white shadow-soft transition hover:bg-leaf-800"
            >
              <Bot className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-5">
        {children}
        <div className="mt-10 flex justify-center">
          <PrototypeBadge />
        </div>
      </main>

      {/* Bottom tabs: large touch targets, icon + short label, clear active pill. */}
      <nav
        aria-label="Farmer app"
        className="fixed inset-x-0 bottom-0 z-[1000] border-t border-line bg-white/96 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <ul className="mx-auto grid max-w-3xl grid-cols-5">
          {TABS.map(({ href, key, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold transition ${
                    active ? "text-leaf-800" : "text-muted hover:text-ink"
                  }`}
                >
                  <span className={`grid h-7 w-11 place-items-center rounded-full transition ${active ? "bg-leaf-100" : ""}`}>
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="truncate">{t(key)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* SMS / WhatsApp launcher on every tabbed farmer screen */}
      {!chatOpen && <MessageLauncher />}

      {chatOpen && <ChatbotPanel onClose={closeChat} />}
    </div>
  );
}
