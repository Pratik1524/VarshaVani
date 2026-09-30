"use client";

import Link from "next/link";
import { PrototypeBadge } from "@/components/ui/Logo";
import { useT } from "@/hooks/useT";

export function SiteFooter() {
  const { t } = useT();
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 text-[13px] text-slate-500 sm:flex-row">
        <div className="flex flex-wrap items-center gap-3">
          <PrototypeBadge />
          <span className="hidden h-4 w-px bg-slate-200 sm:block" aria-hidden />
          <span>SIH PS 26086 · Hyperlocal Monsoon Onset &amp; Break Prediction</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/methodology" className="transition hover:text-monsoon-800">
            {t("nav.methodology")}
          </Link>
          <span className="h-4 w-px bg-slate-200" aria-hidden />
          <Link href="/gateway" className="transition hover:text-monsoon-800">
            {t("nav.gateway")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
