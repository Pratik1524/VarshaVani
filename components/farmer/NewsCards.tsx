"use client";

import Link from "next/link";
import { ChevronRight, CloudSun, Droplets, FlaskConical, Landmark, Tractor, type LucideIcon } from "lucide-react";
import type { NewsCategory, NewsItem } from "@/data/news";
import { NEWS } from "@/data/news";
import { useT } from "@/hooks/useT";
import { fmtDate } from "@/lib/i18n";
import { tx } from "@/lib/i18n/farmerExtras";
import { H2 } from "@/lib/ui";

export const NEWS_STYLE: Record<NewsCategory, { icon: LucideIcon; tile: string; chip: string }> = {
  research: { icon: FlaskConical, tile: "bg-leaf-50 text-leaf-700 ring-leaf-100", chip: "bg-leaf-50 text-leaf-800" },
  weather: { icon: CloudSun, tile: "bg-monsoon-50 text-monsoon-700 ring-monsoon-100", chip: "bg-monsoon-50 text-monsoon-800" },
  scheme: { icon: Landmark, tile: "bg-sun-50 text-sun-600 ring-sun-100", chip: "bg-sun-50 text-sun-600" },
  technique: { icon: Tractor, tile: "bg-soil-100 text-soil-700 ring-soil-100", chip: "bg-soil-100 text-soil-800" },
  water: { icon: Droplets, tile: "bg-sky-50 text-sky-700 ring-sky-100", chip: "bg-sky-50 text-sky-800" },
};

/** One tappable news card. */
export function NewsCard({ item }: { item: NewsItem }) {
  const { lang } = useT();
  const style = NEWS_STYLE[item.category];
  return (
    <Link
      href={`/farmer/news/${item.id}`}
      className="group flex gap-3 rounded-card border border-line bg-white p-3.5 shadow-soft transition hover:border-leaf-300 hover:bg-leaf-50/30"
    >
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-control ring-1 ${style.tile}`}>
        <style.icon className="h-6 w-6" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[11px] text-muted">
          <span className={`rounded-full px-2 py-0.5 font-semibold ${style.chip}`}>{tx(lang, `cat.${item.category}`)}</span>
          <span>{fmtDate(lang, item.date)}</span>
        </span>
        <span className="mt-1.5 block text-[14.5px] font-bold leading-snug text-ink">{item.title[lang]}</span>
        <span className="mt-1 line-clamp-2 block text-[13px] leading-relaxed text-body">{item.summary[lang]}</span>
        <span className="mt-1.5 inline-flex items-center gap-0.5 text-[12.5px] font-semibold text-leaf-700 group-hover:text-leaf-800">
          {tx(lang, "newsRead")} <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </span>
    </Link>
  );
}

/** Home-screen section: news and breakthroughs as cards. */
export function NewsSection() {
  const { lang } = useT();
  return (
    <section aria-labelledby="news">
      <div className="mb-2.5">
        <h2 id="news" className={H2}>
          {tx(lang, "newsTitle")}
        </h2>
        <p className="mt-0.5 text-[12.5px] text-muted">{tx(lang, "newsSubtitle")}</p>
      </div>
      <ul className="space-y-2.5">
        {NEWS.map((n) => (
          <li key={n.id}>
            <NewsCard item={n} />
          </li>
        ))}
      </ul>
      <p className="mt-2.5 text-[11.5px] leading-relaxed text-muted">{tx(lang, "newsNote")}</p>
    </section>
  );
}
