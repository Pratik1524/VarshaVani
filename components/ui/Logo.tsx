"use client";

import Link from "next/link";
import { useT } from "@/hooks/useT";

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      {/* Leaf blade */}
      <path d="M40 8C22 8 11 17 11 29c0 4.1 1.4 7.6 3.8 10.2C19.6 27.4 27.6 19 39 14.2 30.4 20 22.9 28.7 18.6 41.4c2 .9 4.2 1.4 6.6 1.4C36.6 42.8 42 31.4 42 17.6c0-3.6-.6-6.8-2-9.6z" fill="#336f28" />
      {/* Mid-rib, kept light so the mark reads at small sizes */}
      <path d="M39 14.2C30.4 20 22.9 28.7 18.6 41.4" stroke="#dcedd6" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Logo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  const { t } = useT();
  return (
    <Link href={href} className="flex shrink-0 items-center gap-2 rounded-xl" aria-label={`${t("app.name")} home`}>
      <LogoMark />
      {!compact && (
        <span className="leading-tight">
          <span className="block whitespace-nowrap text-[17px] font-bold tracking-tight text-monsoon-900">{t("app.name")}</span>
          <span className="hidden whitespace-nowrap text-[10.5px] font-medium leading-tight text-slate-500 sm:block lg:hidden 2xl:block">
            {t("app.tagline")}
          </span>
        </span>
      )}
    </Link>
  );
}

export function PrototypeBadge({ className = "" }: { className?: string }) {
  const { t } = useT();
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-sun-200 bg-sun-50 px-2.5 py-1 text-[11.5px] font-semibold text-sun-600 ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-sun-500" aria-hidden />
      {t("proto.badge")}
    </span>
  );
}
