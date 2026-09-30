"use client";

import { Check, ChevronRight, MapPin, Sprout } from "lucide-react";
import { useAppStore, useActiveCrop } from "@/lib/store";
import { useT } from "@/hooks/useT";
import { useFarmerData } from "@/hooks/useFarmerData";
import { getAdvisory } from "@/lib/advisoryEngine";
import { blockName } from "@/data/blocks";
import { H1_FARMER, H3 } from "@/lib/ui";
import { SafeToSowCard } from "@/components/advisory/SafeToSowCard";
import { WeekTimeline } from "@/components/advisory/WeekTimeline";
import { CropSwitcher } from "@/components/farmer/CropSwitcher";
import { Card, SectionHeading } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/ui/States";
import { NewsSection } from "@/components/farmer/NewsCards";

export default function FarmerHome() {
  const { t, tm, lang } = useT();
  const user = useAppStore((s) => s.user);
  const village = useAppStore((s) => s.village);
  const crop = useActiveCrop();
  const { block, data, error, reload } = useFarmerData();

  const advisory = data && crop ? getAdvisory(crop.crop, crop.stage, data.forecast, 1, { drivers: data.drivers, block }) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className={H1_FARMER}>{t("home.greeting", { name: user?.name.split(" ")[0] ?? "" })}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-leaf-600" aria-hidden />
            <span className="truncate">
              {village}, {blockName(block, lang)} · {block?.district}
            </span>
          </p>
        </div>
        <ButtonLink href="/farmer/crops" variant="ghost" size="sm" className="shrink-0">
          {t("home.change")}
        </ButtonLink>
      </div>

      <CropSwitcher />

      {error ? (
        <ErrorState onRetry={reload} />
      ) : !crop ? (
        <EmptyState
          title={t("advice.empty")}
          icon={Sprout}
          action={
            <ButtonLink href="/farmer/crops" size="lg" icon={Sprout}>
              {t("advice.addCrop")}
            </ButtonLink>
          }
        />
      ) : !data || !advisory ? (
        <div className="space-y-4">
          <CardSkeleton lines={5} />
          <CardSkeleton lines={2} />
        </div>
      ) : (
        <>
          {/* 1. What is happening & what should I do? */}
          <SafeToSowCard compact advisory={advisory} recentRainMm={data.forecast.recentRainMm} falseOnset={data.forecast.falseOnsetRisk} />

          {/* 2. What happens next? */}
          <section aria-labelledby="next4">
            <SectionHeading
              id="next4"
              title={t("home.next4")}
              className="mb-2.5"
              action={
                <ButtonLink href="/farmer/outlook" variant="ghost" size="sm" iconEnd={ChevronRight}>
                  {t("common.viewAll")}
                </ButtonLink>
              }
            />
            <WeekTimeline forecast={data.forecast} compact />
          </section>

          {(advisory.alternatives.length > 0 || advisory.alsoDo.length > 0) && (
            <Card pad labelledBy="today">
              <h2 id="today" className={H3}>
                {t("home.todayAdvice")}
              </h2>
              <ul className="mt-2.5 space-y-2 text-[14.5px] leading-relaxed text-body">
                {[...advisory.alsoDo, ...advisory.alternatives].slice(0, 3).map((m, i) => (
                  <li key={i} className="flex gap-2.5">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-leaf-600" aria-hidden />
                    {tm(m)}
                  </li>
                ))}
              </ul>
              <ButtonLink href="/farmer/advisories" variant="ghost" size="sm" iconEnd={ChevronRight} className="mt-3 -ml-2.5">
                {t("common.why")}
              </ButtonLink>
            </Card>
          )}
        </>
      )}

      {/* 3. News and breakthroughs */}
      <NewsSection />
    </div>
  );
}
