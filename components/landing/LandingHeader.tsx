"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, LogIn } from "lucide-react";
import { LogoMark } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useAppStore, useHydrated } from "@/lib/store";
import { useT } from "@/hooks/useT";

/**
 * Minimal landing header: brand, language and the Log in / Sign up button.
 * Light text over the hero photo, turning into frosted glass once the page
 * scrolls. Feature pages are reached after login, so there is no feature nav.
 */
export function LandingHeader() {
  const { t } = useT();
  const hydrated = useHydrated();
  const user = useAppStore((s) => s.user);
  const [scrolled, setScrolled] = useState(false);
  // The auth page itself does not need a link to itself.
  const onAuthPage = usePathname() === "/login";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[1000] transition-[background-color,box-shadow,backdrop-filter] duration-300 ${
        scrolled ? "bg-white/80 shadow-[0_1px_0_rgb(11_29_51/0.06),0_8px_24px_-12px_rgb(11_29_51/0.18)] backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">
        {t("nav.skip")}
      </a>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 rounded-xl" aria-label={`${t("app.name")} home`}>
          <span className={`grid h-9 w-9 place-items-center rounded-xl transition ${scrolled ? "" : "bg-white/90 shadow-soft"}`}>
            <LogoMark className="h-7 w-7" />
          </span>
          <span className={`text-[17px] font-bold tracking-tight transition-colors ${scrolled ? "text-monsoon-900" : "text-white [text-shadow:0_1px_8px_rgb(0_0_0/0.35)]"}`}>
            {t("app.name")}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-white/80 p-0.5 shadow-soft ring-1 ring-white/70 backdrop-blur-md">
            <LanguageSwitcher compact />
          </div>
          {onAuthPage ? null : hydrated && user ? (
            // Signed-in visitors keep a way back into their app.
            <Link
              href={user.role === "officer" ? "/officer" : "/farmer"}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-leaf-700 px-3 text-[13px] font-semibold text-white shadow-soft transition hover:bg-leaf-800 sm:px-3.5"
            >
              <span className="max-[380px]:sr-only">{user.role === "officer" ? t("nav.officer") : t("nav.home")}</span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-leaf-700 px-3 text-[13px] font-semibold text-white shadow-[0_8px_18px_-8px_rgb(41_88_34/0.7)] transition hover:-translate-y-px hover:bg-leaf-800 sm:px-3.5"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              <span className="max-sm:sr-only">{t("landing.ctaAuth")}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
