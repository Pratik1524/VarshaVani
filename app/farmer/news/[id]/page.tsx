"use client";

import { useParams } from "next/navigation";
import { CheckCircle2, Clock, Newspaper } from "lucide-react";
import { NEWS, NEWS_BY_ID } from "@/data/news";
import { NEWS_STYLE, NewsCard } from "@/components/farmer/NewsCards";
import { ListenButton } from "@/components/advisory/ListenButton";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";
import { useT } from "@/hooks/useT";
import { fmtDate } from "@/lib/i18n";
import { tx } from "@/lib/i18n/farmerExtras";
import { H1_FARMER, H3 } from "@/lib/ui";

/** Full story behind a home-screen news card. */
export default function NewsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { lang } = useT();
  const item = NEWS_BY_ID[id];

  if (!item) return <EmptyState title={tx(lang, "newsNotFound")} icon={Newspaper} />;

  const style = NEWS_STYLE[item.category];
  const more = NEWS.filter((n) => n.id !== item.id).slice(0, 2);

  return (
    <article className="space-y-5">
      <header>
        <div className={`mb-4 grid h-28 place-items-center rounded-card ring-1 ${style.tile}`}>
          <style.icon className="h-12 w-12" aria-hidden />
        </div>
        <p className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
          <span className={`rounded-full px-2 py-0.5 font-semibold ${style.chip}`}>{tx(lang, `cat.${item.category}`)}</span>
          <span>{fmtDate(lang, item.date, { day: "numeric", month: "long", year: "numeric" })}</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden /> {item.readMin} min
          </span>
        </p>
        <h1 className={`mt-2 ${H1_FARMER}`}>{item.title[lang]}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-body">{item.summary[lang]}</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[12px] text-muted">{item.source}</p>
          <ListenButton id={`news-${item.id}`} text={[item.title[lang], ...item.body[lang]].join(". ")} />
        </div>
      </header>

      <div className="space-y-3 text-[15px] leading-relaxed text-body">
        {item.body[lang].map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <Card pad className="border-leaf-200 bg-leaf-50/60">
        <h2 className={H3}>{tx(lang, "newsTakeaways")}</h2>
        <ul className="mt-2.5 space-y-2">
          {item.takeaways[lang].map((t, i) => (
            <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed text-body">
              <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-leaf-600" aria-hidden />
              {t}
            </li>
          ))}
        </ul>
      </Card>

      <p className="text-[11.5px] leading-relaxed text-muted">{tx(lang, "newsNote")}</p>

      <section aria-labelledby="more-news">
        <h2 id="more-news" className={`mb-2.5 ${H3}`}>
          {tx(lang, "newsMore")}
        </h2>
        <ul className="space-y-2.5">
          {more.map((n) => (
            <li key={n.id}>
              <NewsCard item={n} />
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
